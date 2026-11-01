export const PROJECT_TYPES = {
  Website: "WEBSITE",
  "Ecommerce website": "SHOP",
  "Mobile app": "APP",
  ERP: "ERP",
} as const;

const alwaysAsked = new Set(["company-name", "contact-name", "work-email", "project-type", "project-description"]);

export type BriefQuestion = {
  id: string;
  section: string;
  sectionLabel: string;
  sectionSort: number;
  sort: number;
  label: string;
  help: string;
  kind: "SHORT" | "LONG" | "DROPDOWN" | "MULTI" | "URL" | "URLS" | "DATE" | "FILE";
  options: string[];
  types: string[];
  required: boolean;
  locked: boolean;
  hidden: boolean;
  dependsOn: string;
  dependsValue: string;
};

export type UrlRow = { url: string; note: string };

export type BriefSection = {
  id: string;
  label: string;
  sort: number;
  questions: BriefQuestion[];
};

const FILE_LIMIT = 8 * 1024 * 1024;

export const fileLimitBytes = FILE_LIMIT;

const fileTypes = new Map<string, string>([
  ["pdf", "application/pdf"],
  ["doc", "application/msword"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
]);

export function briefLabel(status: string): string {
  if (status === "FILLED") return "Filled";
  if (status === "SIGNED") return "Signed";
  return "Sent";
}

export function deskStatus(job: { briefStatus: string; confirmedAt?: Date | null }): string {
  if (job.confirmedAt) return "Confirmed";
  return briefLabel(job.briefStatus);
}

export function answerMap(answers: { questionId: string; value: string }[]): Map<string, string> {
  return new Map(answers.map((answer) => [answer.questionId, answer.value]));
}

export function questionVisible(question: BriefQuestion, answers: Map<string, string>): boolean {
  if (question.hidden) return false;
  if (!alwaysAsked.has(question.id)) {
    const selected = answers.get("project-type") ?? "";
    const code = PROJECT_TYPES[selected as keyof typeof PROJECT_TYPES];
    if (!code || question.types.length === 0 || !question.types.includes(code)) return false;
  }
  if (question.dependsOn && (answers.get(question.dependsOn) ?? "") !== question.dependsValue) return false;
  return true;
}

export function groupSections(questions: BriefQuestion[], answers: Map<string, string>): BriefSection[] {
  const sections: BriefSection[] = [];
  for (const question of questions) {
    if (!questionVisible(question, answers)) continue;
    let section = sections.find((item) => item.id === question.section);
    if (!section) {
      section = { id: question.section, label: question.sectionLabel, sort: question.sectionSort, questions: [] };
      sections.push(section);
    }
    section.questions.push(question);
  }
  sections.sort((left, right) => left.sort - right.sort || left.label.localeCompare(right.label));
  for (const section of sections) section.questions.sort((left, right) => left.sort - right.sort);
  return sections;
}

export function parseMulti(value: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String);
  } catch {
    return [];
  }
}

export function parseUrlRows(value: string): UrlRow[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const record = row as { url?: unknown; note?: unknown };
      return [{ url: String(record.url ?? "").trim(), note: String(record.note ?? "").trim() }];
    });
  } catch {
    return [];
  }
}

export function formatStoredAnswer(kind: string, value: string): string {
  if (!value) return "";
  if (kind === "MULTI") return parseMulti(value).filter(Boolean).join(", ");
  if (kind === "URLS") {
    return parseUrlRows(value)
      .map((row) => [row.url, row.note].filter(Boolean).join(" — "))
      .filter(Boolean)
      .join("\n");
  }
  return value.trim();
}

export function answerBlank(kind: string, value: string): boolean {
  return !formatStoredAnswer(kind, value).trim();
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

export function answerProblem(question: BriefQuestion, value: string): string | null {
  if (question.id === "work-email" && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return "Enter a valid work email.";
  }
  if (question.kind === "URL" && value.trim() && !isHttpUrl(value)) {
    return "Links need to start with http:// or https://.";
  }
  if (question.kind === "URLS") {
    for (const row of parseUrlRows(value)) {
      if (row.url && !isHttpUrl(row.url)) return "Links need to start with http:// or https://.";
    }
  }
  if (question.kind === "DATE" && value.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return "Enter the launch date as a calendar date.";
  }
  return null;
}

export function firstProblem(
  questions: BriefQuestion[],
  answers: Map<string, string>,
  throughSectionSort?: number,
): { section: string; questionId: string; message: string } | null {
  const ordered = [...questions].sort((left, right) => left.sectionSort - right.sectionSort || left.sort - right.sort);
  for (const question of ordered) {
    if (!questionVisible(question, answers)) continue;
    if (throughSectionSort !== undefined && question.sectionSort > throughSectionSort) continue;
    const value = answers.get(question.id) ?? "";
    if (question.kind !== "FILE" && question.required && answerBlank(question.kind, value)) {
      return { section: question.section, questionId: question.id, message: `Answer “${question.label}” before you continue.` };
    }
    const problem = answerProblem(question, value);
    if (problem) return { section: question.section, questionId: question.id, message: problem };
  }
  return null;
}

const mimeAliases: Record<string, string[]> = {
  doc: ["application/msword", "application/vnd.ms-word", "application/x-msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  jpg: ["image/jpeg", "image/jpg", "image/pjpeg"],
  jpeg: ["image/jpeg", "image/jpg", "image/pjpeg"],
};

export function fileMime(fileName: string, reported: string): string | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const fromName = fileTypes.get(extension);
  if (!fromName) return null;
  if (!reported || reported === "application/octet-stream" || reported === fromName) return fromName;
  if ((mimeAliases[extension] ?? []).includes(reported)) return fromName;
  return null;
}

export function acceptedFile(fileName: string, reported: string, size: number): string | null {
  if (size <= 0) return null;
  if (size > FILE_LIMIT) return `${fileName} is larger than 8 MB.`;
  const mime = fileMime(fileName, reported);
  if (!mime) return `${fileName} needs to be a PDF, Word, PNG, JPEG, or WebP file.`;
  return null;
}

export function cleanFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\- ()+\u3400-\u9fff]/g, "").slice(0, 180);
  return cleaned || "file";
}

export function columnUpdates(
  answers: Map<string, string>,
  current: { clientName: string; clientEmail: string; clientCompany: string; summary: string; title: string },
) {
  const companyName = (answers.get("company-name") ?? "").trim();
  const contact = (answers.get("contact-name") ?? "").trim();
  const email = (answers.get("work-email") ?? "").trim();
  const description = (answers.get("project-description") ?? "").trim();
  return {
    clientCompany: companyName || current.clientCompany,
    clientName: contact || current.clientName,
    clientEmail: email || current.clientEmail,
    summary: description || current.summary,
    title: current.title,
  };
}

export function prefillAnswer(
  questionId: string,
  job: { clientName: string; clientEmail: string; clientCompany: string; summary: string },
): string {
  if (questionId === "company-name") return job.clientCompany;
  if (questionId === "contact-name") return job.clientName;
  if (questionId === "work-email") return job.clientEmail;
  if (questionId === "project-description") return job.summary;
  return "";
}
