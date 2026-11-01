import { answerMap, briefLabel, formatStoredAnswer, groupSections, type BriefQuestion } from "@/lib/brief";
import type { PdfParty, RequirementPdfInput } from "@/lib/pdf";

export function answeredSections(input: {
  questions: BriefQuestion[];
  answers: { questionId: string; value: string }[];
  files: { questionId: string; fileName: string }[];
}) {
  const answers = answerMap(input.answers);
  return groupSections(input.questions, answers)
    .map((section) => ({
      id: section.id,
      label: section.label,
      rows: section.questions.flatMap((question) => {
        const written = formatStoredAnswer(question.kind, answers.get(question.id) ?? "");
        const names = input.files.filter((file) => file.questionId === question.id).map((file) => file.fileName);
        const value = [written, names.length ? `Files: ${names.join(", ")}` : ""].filter(Boolean).join("\n");
        return value ? [{ label: question.label, value }] : [];
      }),
    }))
    .filter((section) => section.rows.length > 0);
}

export function requirementPdfInput(input: {
  party: PdfParty;
  number: string;
  title: string;
  clientName: string;
  clientCompany: string;
  date: string;
  briefStatus: string;
  signedInName?: string | null;
  signedInEmail?: string | null;
  signedInAt?: string | null;
  questions: BriefQuestion[];
  answers: { questionId: string; value: string }[];
  files: { questionId: string; fileName: string }[];
}): RequirementPdfInput {
  const sections = answeredSections(input).map((section) => ({ label: section.label, rows: section.rows }));

  return {
    party: input.party,
    number: input.number,
    title: input.title,
    clientName: input.clientName,
    clientCompany: input.clientCompany,
    date: input.date,
    status: briefLabel(input.briefStatus),
    sections,
    signature:
      input.briefStatus === "SIGNED" && input.signedInName && input.signedInEmail && input.signedInAt
        ? { name: input.signedInName, email: input.signedInEmail, date: input.signedInAt }
        : null,
  };
}
