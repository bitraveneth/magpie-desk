import { headers } from "next/headers";
import { company } from "@/content/company";
import { questionBank } from "@/content/questions";
import { ensurePipelineSamples } from "@/lib/sample-pipeline";
import { prisma } from "@/lib/db";
import { formatDocumentNumber, shortNumber, uniqueCode } from "@/lib/contract-number";
import { ndaBody } from "@/lib/nda-text";

const jobInclude = {
  partner: true,
  nda: true,
  answers: true,
  files: {
    select: { id: true, questionId: true, fileName: true, mime: true, createdAt: true },
    orderBy: { createdAt: "asc" as const },
  },
  quotation: {
    include: {
      lines: { orderBy: { sort: "asc" as const } },
      contract: {
        include: {
          invoice: { include: { lines: { orderBy: { sort: "asc" as const } } } },
        },
      },
    },
  },
} as const;

export type DeskJob = NonNullable<Awaited<ReturnType<typeof getJob>>>;

export async function origin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

let deskReady = false;
let deskPromise: Promise<void> | null = null;
let questionCache: Awaited<ReturnType<typeof prisma.requirementQuestion.findMany>> | null = null;
let questionCachedAt = 0;

export function invalidateQuestionCache() {
  questionCache = null;
  questionCachedAt = 0;
}

export async function ensureDesk() {
  if (deskReady) return;
  if (!deskPromise) {
    deskPromise = loadDesk()
      .then(() => {
        deskReady = true;
      })
      .catch((error: unknown) => {
        deskPromise = null;
        throw error;
      });
  }
  await deskPromise;
}

async function loadDesk() {
  await prisma.companyProfile.upsert({
    where: { id: "company" },
    update: {},
    create: {
      id: "company",
      publicName: company.publicName,
      nameEn: company.nameEn,
      nameZh: company.nameZh,
      email: company.email,
      address: company.address,
    },
  });

  await prisma.paymentSettings.upsert({
    where: { id: "payments" },
    update: {},
    create: { id: "payments" },
  });

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(8421101)`;
    const current = await tx.companyProfile.findUniqueOrThrow({ where: { id: "company" } });
    if (current.seeded) return;

    await tx.partner.upsert({
      where: { code: "sample-partner" },
      update: {},
      create: { name: "Sample Partner", code: "sample-partner", sample: true },
    });

    const sampleRequirement = await tx.requirement.findFirst({ where: { sample: true } });
    if (!sampleRequirement) {
      const when = new Date();
      await tx.requirement.create({
        data: {
          number: shortNumber("REQ", when, uniqueCode()),
          shareToken: uniqueCode(12).toLowerCase(),
          clientName: "Sample Client",
          clientEmail: "client@example.com",
          clientCompany: "Sample Studio",
          title: "Sample: Business website",
          summary: "Sample data. A business website brief so the desk is not empty.",
          sample: true,
        },
      });
    }

    await tx.companyProfile.update({
      where: { id: "company" },
      data: { seeded: true },
    });
  });

  await ensureQuestions();
  await refreshUntouchedQuestions();
  await ensurePipelineSamples();
}

const retiredChoices: Record<string, { kind: string; options: string[] }> = {
  "site-languages": { kind: "SHORT", options: [] },
  "dev-language": {
    kind: "DROPDOWN",
    options: ["No preference", "JavaScript or TypeScript", "PHP", "Python", "Java or C#", "Other"],
  },
};

function sameList(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

async function refreshUntouchedQuestions() {
  const rows = await prisma.requirementQuestion.findMany({ where: { id: { in: Object.keys(retiredChoices) } } });
  let changed = false;
  for (const row of rows) {
    const previous = retiredChoices[row.id];
    const seed = questionBank.find((question) => question.id === row.id);
    if (!previous || !seed) continue;
    if (row.kind !== previous.kind || !sameList(row.options, previous.options)) continue;
    await prisma.requirementQuestion.update({
      where: { id: row.id },
      data: {
        section: seed.section,
        sectionLabel: seed.sectionLabel,
        sectionSort: seed.sectionSort,
        sort: seed.sort,
        label: seed.label,
        help: seed.help,
        kind: seed.kind,
        options: seed.options,
        types: seed.types,
      },
    });
    changed = true;
  }
  if (changed) invalidateQuestionCache();
}

async function ensureQuestions() {
  const count = await prisma.requirementQuestion.count();
  if (count >= questionBank.length) return;
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(8421102)`;
    const current = await tx.requirementQuestion.count();
    if (current >= questionBank.length) return;
    for (const question of questionBank) {
      await tx.requirementQuestion.upsert({
        where: { id: question.id },
        update: {},
        create: {
          id: question.id,
          section: question.section,
          sectionLabel: question.sectionLabel,
          sort: question.sort,
          sectionSort: question.sectionSort,
          label: question.label,
          help: question.help,
          kind: question.kind,
          options: question.options,
          types: question.types,
          required: question.required,
          locked: question.locked,
          dependsOn: question.dependsOn,
          dependsValue: question.dependsValue,
        },
      });
    }
  });
}

export async function listQuestions() {
  await ensureDesk();
  if (questionCache && Date.now() - questionCachedAt < 30_000) return questionCache;
  questionCache = await prisma.requirementQuestion.findMany({
    orderBy: [{ sectionSort: "asc" }, { sort: "asc" }],
  });
  questionCachedAt = Date.now();
  return questionCache;
}

export async function getPublicBrief(shareToken: string) {
  await ensureDesk();
  return prisma.requirement.findUnique({
    where: { shareToken },
    include: {
      answers: true,
      files: { select: { id: true, questionId: true, fileName: true } },
      nda: true,
      quotation: { select: { id: true } },
    },
  });
}

export async function getCompany() {
  await ensureDesk();
  const profile = await prisma.companyProfile.findUniqueOrThrow({ where: { id: "company" } });
  return profile;
}

export async function getPayments() {
  await ensureDesk();
  return prisma.paymentSettings.findUniqueOrThrow({ where: { id: "payments" } });
}

export async function getJob(id: string) {
  await ensureDesk();
  return prisma.requirement.findUnique({ where: { id }, include: jobInclude });
}

export async function getJobByToken(shareToken: string) {
  await ensureDesk();
  return prisma.requirement.findUnique({ where: { shareToken }, include: jobInclude });
}

export async function getJobByQuotation(id: string) {
  await ensureDesk();
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    select: { requirementId: true },
  });
  if (!quotation) return null;
  return getJob(quotation.requirementId);
}

export async function getJobByContract(id: string) {
  await ensureDesk();
  const contract = await prisma.contract.findUnique({
    where: { id },
    select: { quotation: { select: { requirementId: true } } },
  });
  if (!contract) return null;
  return getJob(contract.quotation.requirementId);
}

export async function getJobByInvoice(id: string) {
  await ensureDesk();
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { contract: { select: { quotation: { select: { requirementId: true } } } } },
  });
  if (!invoice) return null;
  return getJob(invoice.contract.quotation.requirementId);
}

export async function listRequirements() {
  await ensureDesk();
  return prisma.requirement.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      partner: true,
      nda: true,
      quotation: { include: { contract: { include: { invoice: { include: { lines: true } } } } } },
    },
  });
}

export async function listPartners() {
  await ensureDesk();
  return prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requirements: {
        include: {
          quotation: { include: { contract: { include: { invoice: { include: { lines: true } } } } } },
        },
      },
    },
  });
}

export async function getPartner(id: string) {
  await ensureDesk();
  return prisma.partner.findUnique({
    where: { id },
    include: {
      requirements: {
        orderBy: { updatedAt: "desc" },
        include: {
          quotation: { include: { contract: { include: { invoice: { include: { lines: true } } } } } },
        },
      },
    },
  });
}

export async function getPartnerByCode(code: string) {
  await ensureDesk();
  return prisma.partner.findUnique({ where: { code } });
}

export function contractCompanyName(clientCompany: string, publicName: string): string {
  return clientCompany.trim() || publicName;
}

export async function takeDocumentNumber(companyName: string, kind?: "NDA") {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const number = formatDocumentNumber(companyName, new Date(), uniqueCode(), kind);
    const existing = kind === "NDA"
      ? await prisma.nda.findUnique({ where: { number } })
      : await prisma.contract.findUnique({ where: { number } });
    if (!existing) return number;
  }
  throw new Error("Could not generate a unique document number");
}

export async function takeShortNumber(prefix: "REQ" | "QUO" | "INV") {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const number = shortNumber(prefix, new Date(), uniqueCode());
    const existing =
      prefix === "REQ"
        ? await prisma.requirement.findUnique({ where: { number } })
        : prefix === "QUO"
          ? await prisma.quotation.findUnique({ where: { number } })
          : await prisma.invoice.findUnique({ where: { number } });
    if (!existing) return number;
  }
  throw new Error("Could not generate a unique number");
}

export async function takeShareToken() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const shareToken = uniqueCode(12).toLowerCase();
    const existing = await prisma.requirement.findUnique({ where: { shareToken } });
    if (!existing) return shareToken;
  }
  throw new Error("Could not generate a requirement link");
}

export function freshNdaBody(job: { clientName: string; clientCompany: string; title: string }) {
  return ndaBody(job);
}
