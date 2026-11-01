"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { notifyRequirement } from "@/lib/notices";
import { prisma } from "@/lib/db";
import { ndaBody } from "@/lib/nda-text";
import { contractCompanyName, getCompany, invalidateQuestionCache, listQuestions, takeDocumentNumber } from "@/lib/queries";
import {
  acceptedFile,
  answerMap,
  cleanFileName,
  columnUpdates,
  fileMime,
  firstProblem,
  groupSections,
  parseMulti,
  parseUrlRows,
  type BriefQuestion,
} from "@/lib/brief";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function redirectBrief(token: string, options: { section?: string; notice?: string; error?: string }): never {
  revalidatePath("/", "layout");
  const params = new URLSearchParams();
  if (options.section) params.set("section", options.section);
  if (options.notice) params.set("notice", options.notice);
  if (options.error) params.set("error", options.error);
  const query = params.toString();
  redirect(query ? `/r/${token}?${query}` : `/r/${token}`);
}

function readAnswer(question: BriefQuestion, formData: FormData): string {
  if (question.kind === "FILE") return "";
  if (question.kind === "MULTI") {
    const values = formData
      .getAll(`a_${question.id}`)
      .map((value) => String(value).trim())
      .filter((value) => question.options.includes(value));
    return JSON.stringify(values);
  }
  if (question.kind === "URLS") {
    const rows = [1, 2, 3]
      .map((index) => ({
        url: text(formData, `url_${question.id}_${index}`),
        note: text(formData, `note_${question.id}_${index}`),
      }))
      .filter((row) => row.url || row.note);
    return JSON.stringify(rows);
  }
  const value = text(formData, `a_${question.id}`);
  if (question.kind === "DROPDOWN" && value && !question.options.includes(value)) return "";
  return value;
}

export async function saveBriefSection(formData: FormData) {
  const token = text(formData, "token");
  const sectionId = text(formData, "section");
  const go = text(formData, "go") || "stay";
  const job = await prisma.requirement.findUnique({
    where: { shareToken: token },
    include: { files: { select: { id: true, questionId: true } }, answers: true, quotation: true },
  });
  if (!job) redirect("/");
  if (job.briefStatus !== "SENT" || job.quotation) {
    redirectBrief(token, { error: "This requirement can no longer be edited." });
  }

  const questions = await listQuestions();
  const existing = answerMap(job.answers);
  const onForm = groupSections(questions, existing).find((section) => section.id === sectionId)?.questions ?? [];

  const removeIds = new Set(formData.getAll("removeFile").map(String));
  const uploads: { questionId: string; fileName: string; mime: string; bytes: Uint8Array<ArrayBuffer> }[] = [];
  const fileErrors: string[] = [];

  for (const question of onForm) {
    if (question.kind !== "FILE") continue;
    const incoming = formData
      .getAll(`file_${question.id}`)
      .filter((item): item is File => item instanceof File && item.size > 0);
    const kept = job.files.filter((file) => file.questionId === question.id && !removeIds.has(file.id)).length;
    if (kept + incoming.length > 8) {
      fileErrors.push("You can upload up to 8 files on one question.");
      continue;
    }
    for (const file of incoming) {
      const problem = acceptedFile(file.name, file.type, file.size);
      if (problem) {
        fileErrors.push(problem);
        continue;
      }
      const mime = fileMime(file.name, file.type);
      if (!mime) continue;
      const data = await file.arrayBuffer();
      const copy = new ArrayBuffer(data.byteLength);
      new Uint8Array(copy).set(new Uint8Array(data));
      uploads.push({
        questionId: question.id,
        fileName: cleanFileName(file.name),
        mime,
        bytes: new Uint8Array(copy),
      });
    }
  }

  const merged = new Map(existing);
  await prisma.$transaction(async (tx) => {
    for (const question of onForm) {
      if (question.kind === "FILE") continue;
      const value = readAnswer(question, formData);
      merged.set(question.id, value);
      await tx.requirementAnswer.upsert({
        where: { requirementId_questionId: { requirementId: job.id, questionId: question.id } },
        create: { requirementId: job.id, questionId: question.id, value },
        update: { value },
      });
    }
    const fileQuestionIds = onForm.filter((question) => question.kind === "FILE").map((question) => question.id);
    if (removeIds.size > 0 && fileQuestionIds.length > 0) {
      await tx.requirementFile.deleteMany({
        where: { id: { in: [...removeIds] }, requirementId: job.id, questionId: { in: fileQuestionIds } },
      });
    }
    if (uploads.length > 0) {
      await tx.requirementFile.createMany({
        data: uploads.map((file) => ({ ...file, requirementId: job.id })),
      });
    }
    await tx.requirement.update({
      where: { id: job.id },
      data: columnUpdates(merged, job),
    });
  });

  if (fileErrors.length > 0) {
    redirectBrief(token, { section: sectionId, error: fileErrors[0] });
  }

  const sections = groupSections(questions, merged);
  const index = Math.max(0, sections.findIndex((section) => section.id === sectionId));
  const currentSort = sections[index]?.sort ?? questions.find((question) => question.section === sectionId)?.sectionSort ?? 0;

  if (go === "submit") {
    const problem = firstProblem(questions, merged);
    if (problem) redirectBrief(token, { section: problem.section, error: problem.message });
    await prisma.requirement.update({
      where: { id: job.id },
      data: { ...columnUpdates(merged, job), briefStatus: "FILLED", status: "READY", correctionNote: "" },
    });
    await notifyRequirement(job.id, "FILLED", `${job.title} was filled in and is ready to review.`);
    redirectBrief(token, { notice: "Requirement submitted. Download the PDF, then sign it." });
  }

  if (go === "next") {
    const problem = firstProblem(questions, merged, currentSort);
    if (problem) redirectBrief(token, { section: problem.section, error: problem.message });
    const next = sections[Math.min(sections.length - 1, index + 1)];
    redirectBrief(token, { section: next?.id ?? sectionId, notice: "Saved." });
  }

  if (go === "back") {
    const previous = sections[Math.max(0, index - 1)];
    redirectBrief(token, { section: previous?.id ?? sectionId, notice: "Saved." });
  }

  redirectBrief(token, { section: sections[index]?.id ?? sectionId, notice: "Saved. You can leave and come back with this link." });
}

export async function reopenBrief(formData: FormData) {
  const token = text(formData, "token");
  const job = await prisma.requirement.findUnique({
    where: { shareToken: token },
    include: { quotation: true },
  });
  if (!job) redirect("/");
  if (job.briefStatus === "SIGNED" || job.quotation) {
    redirectBrief(token, { error: "This requirement can no longer be edited." });
  }
  await prisma.requirement.update({
    where: { id: job.id },
    data: { briefStatus: "SENT", status: "DRAFT" },
  });
  redirectBrief(token, { section: "company", notice: "You can edit the answers and submit again." });
}

export async function signRequirement(formData: FormData) {
  const token = text(formData, "token");
  const job = await prisma.requirement.findUnique({
    where: { shareToken: token },
    include: { nda: true },
  });
  if (!job) redirect("/");
  if (job.briefStatus === "SENT") {
    redirectBrief(token, { error: "Submit the questionnaire before signing." });
  }
  if (job.briefStatus === "SIGNED") {
    redirectBrief(token, { notice: "This requirement is already signed." });
  }
  const name = text(formData, "name");
  const email = text(formData, "email");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectBrief(token, { error: "Sign with your name and a valid email." });
  }

  await prisma.requirement.update({
    where: { id: job.id },
    data: {
      signedInName: name,
      signedInEmail: email,
      signedInAt: new Date(),
      briefStatus: "SIGNED",
      status: "READY",
      correctionNote: "",
    },
  });
  await notifyRequirement(job.id, "SIGNED", `${job.title} was signed by ${name}. Confirm it before the quotation.`);

  const wantsNda = text(formData, "signNda") === "yes";
  if (!wantsNda) redirectBrief(token, { notice: "Requirement signed." });
  if (job.nda?.status === "SIGNED") {
    redirectBrief(token, { notice: "Requirement signed. The NDA was already signed." });
  }

  const profile = await getCompany();
  const body = job.nda?.body || ndaBody({ ...job, clientName: name });
  const number =
    job.nda?.number || (await takeDocumentNumber(contractCompanyName(job.clientCompany, profile.publicName), "NDA"));
  await prisma.nda.upsert({
    where: { requirementId: job.id },
    update: { status: "SIGNED", signerName: name, signerEmail: email, signedAt: new Date(), body },
    create: {
      number,
      requirementId: job.id,
      body,
      status: "SIGNED",
      signerName: name,
      signerEmail: email,
      signedAt: new Date(),
    },
  });
  redirectBrief(token, { notice: "Requirement signed, and the NDA is signed." });
}

export async function saveQuestions(formData: FormData) {
  const questions = await listQuestions();
  for (const question of questions) {
    const label = text(formData, `label_${question.id}`);
    const help = String(formData.get(`help_${question.id}`) ?? "").trim();
    if (!label) {
      revalidatePath("/", "layout");
      redirect("/requirements/questions?error=Every%20question%20needs%20a%20label.");
    }
    let options = question.options;
    if (!question.locked && (question.kind === "DROPDOWN" || question.kind === "MULTI")) {
      options = text(formData, `options_${question.id}`)
        .split("\n")
        .map((choice) => choice.trim())
        .filter(Boolean);
      if (options.length < 2) {
        revalidatePath("/", "layout");
        redirect(`/requirements/questions?error=${encodeURIComponent(`${label} needs at least two choices.`)}`);
      }
    }
    await prisma.requirementQuestion.update({
      where: { id: question.id },
      data: {
        label,
        help,
        options,
        hidden: question.locked ? false : formData.get(`hidden_${question.id}`) === "yes",
      },
    });
  }
  invalidateQuestionCache();
  revalidatePath("/", "layout");
  redirect("/requirements/questions?notice=Questions%20saved.");
}

function normalizeValue(question: BriefQuestion, raw: string): string {
  if (question.kind === "DROPDOWN") {
    const value = raw.trim();
    return value && question.options.includes(value) ? value : "";
  }
  if (question.kind === "MULTI") {
    return JSON.stringify(parseMulti(raw).filter((value) => question.options.includes(value)));
  }
  if (question.kind === "URLS") {
    return JSON.stringify(parseUrlRows(raw).slice(0, 3));
  }
  return raw.trim();
}

async function openBrief(token: string) {
  return prisma.requirement.findUnique({
    where: { shareToken: token },
    include: { quotation: { select: { id: true } }, answers: true, nda: true },
  });
}

async function writeAnswers(
  job: NonNullable<Awaited<ReturnType<typeof openBrief>>>,
  questions: BriefQuestion[],
  patch: Record<string, string>,
) {
  const merged = answerMap(job.answers);
  const known = new Map(questions.map((question) => [question.id, question]));
  const entries = Object.entries(patch).filter(([id]) => {
    const question = known.get(id);
    return question && question.kind !== "FILE";
  });
  if (entries.length === 0) return merged;
  await prisma.$transaction(async (tx) => {
    for (const [id, raw] of entries) {
      const value = normalizeValue(known.get(id)!, raw);
      merged.set(id, value);
      await tx.requirementAnswer.upsert({
        where: { requirementId_questionId: { requirementId: job.id, questionId: id } },
        create: { requirementId: job.id, questionId: id, value },
        update: { value },
      });
    }
    await tx.requirement.update({
      where: { id: job.id },
      data: columnUpdates(merged, job),
    });
  });
  return merged;
}

export async function saveBriefDraft(token: string, patch: Record<string, string>) {
  const job = await openBrief(token);
  if (!job) return { ok: false as const, error: "This link is not active." };
  if (job.briefStatus !== "SENT" || job.quotation) {
    return { ok: false as const, error: "This requirement can no longer be edited." };
  }
  await writeAnswers(job, await listQuestions(), patch);
  return { ok: true as const };
}

export async function submitBrief(token: string, patch: Record<string, string>) {
  const job = await openBrief(token);
  if (!job) return { ok: false as const, error: "This link is not active." };
  if (job.briefStatus !== "SENT" || job.quotation) {
    return { ok: false as const, error: "This requirement can no longer be edited." };
  }
  const questions = await listQuestions();
  const merged = await writeAnswers(job, questions, patch);
  const problem = firstProblem(questions, merged);
  if (problem) return { ok: false as const, error: problem.message, questionId: problem.questionId };
  await prisma.requirement.update({
    where: { id: job.id },
    data: { ...columnUpdates(merged, job), briefStatus: "FILLED", status: "READY", correctionNote: "" },
  });
  await notifyRequirement(job.id, "FILLED", `${job.title} was filled in and is ready to review.`);
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function reopenBriefNow(token: string) {
  const job = await openBrief(token);
  if (!job) return { ok: false as const, error: "This link is not active." };
  if (job.briefStatus === "SIGNED" || job.quotation) {
    return { ok: false as const, error: "This requirement can no longer be edited." };
  }
  await prisma.requirement.update({
    where: { id: job.id },
    data: { briefStatus: "SENT", status: "DRAFT" },
  });
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function signBrief(token: string, name: string, email: string, signNda: boolean) {
  const job = await openBrief(token);
  if (!job) return { ok: false as const, error: "This link is not active." };
  if (job.briefStatus === "SENT") return { ok: false as const, error: "Submit the questionnaire before signing." };
  if (job.briefStatus === "SIGNED") return { ok: true as const, already: true as const };
  const signer = name.trim();
  const signerEmail = email.trim();
  if (!signer || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail)) {
    return { ok: false as const, error: "Sign with your name and a valid email." };
  }
  const signedAt = new Date();
  await prisma.requirement.update({
    where: { id: job.id },
    data: {
      signedInName: signer,
      signedInEmail: signerEmail,
      signedInAt: signedAt,
      briefStatus: "SIGNED",
      status: "READY",
      correctionNote: "",
    },
  });
  await notifyRequirement(job.id, "SIGNED", `${job.title} was signed by ${signer}. Confirm it before the quotation.`);
  let ndaSigned = job.nda?.status === "SIGNED";
  if (signNda && !ndaSigned) {
    const profile = await getCompany();
    const body = job.nda?.body || ndaBody({ ...job, clientName: signer });
    const number =
      job.nda?.number || (await takeDocumentNumber(contractCompanyName(job.clientCompany, profile.publicName), "NDA"));
    await prisma.nda.upsert({
      where: { requirementId: job.id },
      update: { status: "SIGNED", signerName: signer, signerEmail, signedAt, body },
      create: {
        number,
        requirementId: job.id,
        body,
        status: "SIGNED",
        signerName: signer,
        signerEmail,
        signedAt,
      },
    });
    ndaSigned = true;
  }
  revalidatePath("/", "layout");
  return { ok: true as const, already: false as const, ndaSigned, signedAt: signedAt.toISOString() };
}

export async function uploadBriefFile(formData: FormData) {
  const token = text(formData, "token");
  const questionId = text(formData, "questionId");
  const job = await openBrief(token);
  if (!job) return { ok: false as const, error: "This link is not active." };
  if (job.briefStatus !== "SENT" || job.quotation) {
    return { ok: false as const, error: "This requirement can no longer be edited." };
  }
  const questions = await listQuestions();
  const question = questions.find((item) => item.id === questionId && item.kind === "FILE");
  if (!question) return { ok: false as const, error: "That upload is not part of this questionnaire." };
  const incoming = formData.getAll("file").filter((item): item is File => item instanceof File && item.size > 0);
  if (incoming.length === 0) return { ok: false as const, error: "Choose a file to upload." };
  const existing = await prisma.requirementFile.count({ where: { requirementId: job.id, questionId } });
  if (existing + incoming.length > 8) return { ok: false as const, error: "You can upload up to 8 files on this question." };
  const created: { id: string; questionId: string; fileName: string }[] = [];
  for (const file of incoming) {
    const problem = acceptedFile(file.name, file.type, file.size);
    if (problem) return { ok: false as const, error: problem };
    const mime = fileMime(file.name, file.type);
    if (!mime) return { ok: false as const, error: `${file.name} needs to be a PDF, Word, PNG, JPEG, or WebP file.` };
    const data = await file.arrayBuffer();
    const copy = new ArrayBuffer(data.byteLength);
    new Uint8Array(copy).set(new Uint8Array(data));
    const saved = await prisma.requirementFile.create({
      data: {
        requirementId: job.id,
        questionId,
        fileName: cleanFileName(file.name),
        mime,
        bytes: new Uint8Array(copy),
      },
      select: { id: true, questionId: true, fileName: true },
    });
    created.push(saved);
  }
  return { ok: true as const, files: created };
}

export async function removeBriefFile(token: string, fileId: string) {
  const job = await openBrief(token);
  if (!job) return { ok: false as const, error: "This link is not active." };
  if (job.briefStatus !== "SENT" || job.quotation) {
    return { ok: false as const, error: "This requirement can no longer be edited." };
  }
  await prisma.requirementFile.deleteMany({ where: { id: fileId, requirementId: job.id } });
  return { ok: true as const };
}

export async function uploadSignedCopy(token: string, formData: FormData) {
  const job = await openBrief(token);
  if (!job) return { ok: false as const, error: "This link is not active." };
  if (job.briefStatus === "SENT" || job.quotation) {
    return { ok: false as const, error: "Sign the requirement before uploading the signed copy." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) return { ok: false as const, error: "Choose the signed PDF." };
  if (file.size > 8 * 1024 * 1024) return { ok: false as const, error: "The signed PDF must be 8 MB or smaller." };
  const mime = fileMime(file.name, file.type);
  if (mime !== "application/pdf") return { ok: false as const, error: "Upload the signed copy as a PDF." };
  const data = await file.arrayBuffer();
  const copy = new ArrayBuffer(data.byteLength);
  new Uint8Array(copy).set(new Uint8Array(data));
  const fileName = cleanFileName(file.name);
  await prisma.requirementFile.deleteMany({ where: { requirementId: job.id, questionId: "__signed_copy" } });
  await prisma.requirementFile.create({
    data: {
      requirementId: job.id,
      questionId: "__signed_copy",
      fileName,
      mime,
      bytes: new Uint8Array(copy),
    },
  });
  await notifyRequirement(job.id, "UPLOAD", `${job.title} has a signed PDF upload: ${fileName}.`);
  revalidatePath("/", "layout");
  return { ok: true as const, fileName };
}
