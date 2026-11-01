import { randomInt } from "node:crypto";

const SKIP = new Set([
  "CO",
  "LTD",
  "LLC",
  "INC",
  "LIMITED",
  "COMPANY",
  "THE",
  "AND",
  "OF",
]);

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function companyPrefix(companyName: string): string {
  const words = companyName
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((word) => word.length > 0 && !SKIP.has(word));

  if (words.length === 0) return "MAGPIE-STUDIO";
  const first = words[0].slice(0, 18);
  const second = (words[1] ?? "CO").slice(0, 18);
  return `${first}-${second}`;
}

export function shanghaiStamp(when: Date): { year: string; date: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(when);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return { year: read("year"), date: `${read("month")}${read("day")}` };
}

export function uniqueCode(length = 4): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

/** MAGPIE-STUDIO-2026-1101-8F2K, or NDA-MAGPIE-STUDIO-2026-1101-8F2K. */
export function formatDocumentNumber(
  companyName: string,
  when: Date,
  unique: string,
  kind?: "NDA",
): string {
  const { year, date } = shanghaiStamp(when);
  const core = `${companyPrefix(companyName.trim() || "Magpie Studio")}-${year}-${date}-${unique}`;
  return kind === "NDA" ? `NDA-${core}` : core;
}

export function shortNumber(prefix: "REQ" | "QUO" | "INV", when: Date, unique: string): string {
  const { year, date } = shanghaiStamp(when);
  return `${prefix}-${year}-${date}-${unique}`;
}

/** First two Latin words of the other company, such as KITE-TRAVEL. */
export function otherCompanyCode(companyName: string): string {
  const words = companyName
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((word) => word.length > 0 && !SKIP.has(word));
  if (words.length === 0) return "";
  const first = words[0].slice(0, 12);
  const second = words[1]?.slice(0, 12);
  return second ? `${first}-${second}` : first;
}

/** MS20261119, or MS20261119-KITE-TRAVEL when the other company has Latin words. */
export function invoiceNumberBase(otherCompany: string, when: Date): string {
  const { year, date } = shanghaiStamp(when);
  const head = `MS${year}${date}`;
  const other = otherCompanyCode(otherCompany);
  return other ? `${head}-${other}` : head;
}
