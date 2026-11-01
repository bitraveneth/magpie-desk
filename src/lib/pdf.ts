import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from "pdf-lib";

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 48;
const ink = rgb(0.059, 0.059, 0.059);
const muted = rgb(0.42, 0.396, 0.376);
const accent = rgb(0.361, 0.176, 0.569);
const rule = rgb(0.898, 0.875, 0.831);

export type PdfParty = {
  publicName: string;
  nameEn: string;
  nameZh: string;
  email: string;
  address: string;
};

export type RequirementPdfInput = {
  party: PdfParty;
  number: string;
  title: string;
  clientName: string;
  clientCompany: string;
  date: string;
  status: string;
  sections: { label: string; rows: { label: string; value: string }[] }[];
  signature?: { name: string; email: string; date: string } | null;
};

export type LinesPdfInput = {
  party: PdfParty;
  documentName: string;
  number: string;
  client: string;
  project: string;
  date: string;
  lines: { description: string; quantity: string; amount: string }[];
  total: string;
  note: string;
  payment?: { title: string; lines: string[]; image?: { bytes: Uint8Array; mime: string } | null } | null;
};

type Pen = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  latin: PDFFont;
  bold: PDFFont;
  cjk: PDFFont | null;
};

const encodeCache = new WeakMap<PDFFont, Map<string, boolean>>();

function canEncode(font: PDFFont, char: string): boolean {
  let cache = encodeCache.get(font);
  if (!cache) {
    cache = new Map();
    encodeCache.set(font, cache);
  }
  const known = cache.get(char);
  if (known !== undefined) return known;
  try {
    font.encodeText(char);
    cache.set(char, true);
    return true;
  } catch {
    cache.set(char, false);
    return false;
  }
}

function isCjk(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    (code >= 0x3400 && code <= 0x9fff) ||
    (code >= 0x3000 && code <= 0x303f) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xff00 && code <= 0xffef)
  );
}

function normalize(text: string): string {
  return text
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u00a0/g, " ");
}

function glyphFont(char: string, latin: PDFFont, cjk: PDFFont | null): PDFFont | null {
  if (isCjk(char)) return cjk && canEncode(cjk, char) ? cjk : null;
  if (canEncode(latin, char)) return latin;
  if (cjk && canEncode(cjk, char)) return cjk;
  return null;
}

type Run = { text: string; font: PDFFont };

function runsOf(text: string, latin: PDFFont, cjk: PDFFont | null): Run[] {
  const runs: Run[] = [];
  let current: Run | null = null;
  for (const char of normalize(text)) {
    const font = glyphFont(char, latin, cjk);
    if (!font) continue;
    if (current && current.font === font) current.text += char;
    else {
      current = { text: char, font };
      runs.push(current);
    }
  }
  return runs;
}

function widthOf(text: string, size: number, latin: PDFFont, cjk: PDFFont | null): number {
  return runsOf(text, latin, cjk).reduce((sum, run) => sum + run.font.widthOfTextAtSize(run.text, size), 0);
}

function drawAt(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  latin: PDFFont,
  cjk: PDFFont | null,
  color: RGB,
) {
  let cursor = x;
  for (const run of runsOf(text, latin, cjk)) {
    page.drawText(run.text, { x: cursor, y, size, font: run.font, color });
    cursor += run.font.widthOfTextAtSize(run.text, size);
  }
}

function tokenize(paragraph: string): string[] {
  const tokens: string[] = [];
  let word = "";
  const flush = () => {
    if (word) tokens.push(word);
    word = "";
  };
  for (const char of paragraph) {
    if (isCjk(char)) {
      flush();
      tokens.push(char);
      continue;
    }
    if (char === " ") {
      flush();
      tokens.push(" ");
      continue;
    }
    word += char;
  }
  flush();
  return tokens;
}

function wrapParagraph(paragraph: string, size: number, maxWidth: number, latin: PDFFont, cjk: PDFFont | null): string[] {
  const source = normalize(paragraph);
  if (!source.trim()) return [""];
  const lines: string[] = [];
  let line = "";
  const place = (token: string) => {
    if (widthOf(token, size, latin, cjk) > maxWidth) {
      if (line.trim()) {
        lines.push(line.trimEnd());
        line = "";
      }
      let chunk = "";
      for (const char of token.trim()) {
        const next = chunk + char;
        if (chunk && widthOf(next, size, latin, cjk) > maxWidth) {
          lines.push(chunk);
          chunk = char;
        } else chunk = next;
      }
      line = chunk;
      return;
    }
    const next = line + token;
    if (line.trim() && widthOf(next, size, latin, cjk) > maxWidth) {
      lines.push(line.trimEnd());
      line = token.trimStart();
    } else line = next;
  };
  for (const token of tokenize(source)) place(token);
  if (line.trim()) lines.push(line.trimEnd());
  return lines.length ? lines : [""];
}

function ensure(pen: Pen, height: number) {
  if (pen.y - height >= margin) return;
  pen.page = pen.doc.addPage([pageWidth, pageHeight]);
  pen.y = pageHeight - margin;
  drawAt(pen.page, pen.doc.getTitle() || "Magpie Studio", margin, pen.y - 10, 9, pen.latin, pen.cjk, muted);
  pen.y -= 24;
}

function drawWrapped(pen: Pen, text: string, size: number, color: RGB, bold = false, gap = 4, width = pageWidth - margin * 2) {
  const latin = bold ? pen.bold : pen.latin;
  for (const paragraph of text.split("\n")) {
    for (const line of wrapParagraph(paragraph, size, width, latin, pen.cjk)) {
      ensure(pen, size + gap);
      drawAt(pen.page, line, margin, pen.y - size, size, latin, pen.cjk, color);
      pen.y -= size + gap;
    }
  }
}

function drawRule(pen: Pen) {
  ensure(pen, 14);
  pen.page.drawLine({
    start: { x: margin, y: pen.y },
    end: { x: pageWidth - margin, y: pen.y },
    thickness: 1,
    color: rule,
  });
  pen.y -= 16;
}

async function loadFontkit() {
  const imported = (await import("@pdf-lib/fontkit")) as { default?: { create: (buffer: Uint8Array) => unknown } };
  return imported.default ?? imported;
}

async function startPdf(party: PdfParty, documentName: string, number: string, client: string, project: string, date: string) {
  const doc = await PDFDocument.create();
  doc.setTitle(`${party.publicName} ${documentName} ${number}`);
  doc.setAuthor(party.nameEn);
  doc.registerFontkit((await loadFontkit()) as Parameters<PDFDocument["registerFontkit"]>[0]);
  const latin = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let cjk: PDFFont | null = null;
  try {
    const bytes = await readFile(path.join(process.cwd(), "src/fonts/noto-sans-sc-pdf.woff2"));
    cjk = await doc.embedFont(bytes, { subset: true });
  } catch {
    cjk = null;
  }
  let logo: PDFImage | null = null;
  try {
    logo = await doc.embedPng(await readFile(path.join(process.cwd(), "public/brand/magpie-logo-purple.png")));
  } catch {
    logo = null;
  }

  const page = doc.addPage([pageWidth, pageHeight]);
  const pen: Pen = { doc, page, y: pageHeight - margin, latin, bold, cjk };
  if (logo) {
    const height = 34;
    const width = (logo.width / logo.height) * height;
    page.drawImage(logo, { x: margin, y: pen.y - height, width, height });
  }
  const rightLines = [party.nameZh, party.nameEn, ...party.address.split("\n"), party.email];
  rightLines.forEach((line, index) => {
    const size = index === 0 ? 10 : 9;
    const font = index === 1 ? bold : latin;
    const textWidth = widthOf(line, size, font, cjk);
    drawAt(page, line, pageWidth - margin - textWidth, pen.y - 12 - index * 13, size, font, cjk, index < 2 ? ink : muted);
  });
  pen.y -= Math.max(48, rightLines.length * 13 + 8);
  drawRule(pen);
  drawWrapped(pen, documentName, 20, ink, true, 6);
  drawWrapped(pen, number, 11, accent, true, 4);
  drawWrapped(pen, date, 10, muted, false, 8);
  drawWrapped(pen, client || "Client", 13, ink, true, 3);
  if (project) drawWrapped(pen, project, 10, muted, false, 4);
  return pen;
}

function finish(pen: Pen): Promise<Uint8Array> {
  const pages = pen.doc.getPages();
  pages.forEach((page, index) => {
    const label = `${index + 1} / ${pages.length}`;
    const width = pen.latin.widthOfTextAtSize(label, 9);
    page.drawText(label, { x: pageWidth - margin - width, y: 28, size: 9, font: pen.latin, color: muted });
  });
  return pen.doc.save();
}

export function pdfResponse(bytes: Uint8Array, filename: string) {
  const safe = filename.replace(/[^A-Za-z0-9._-]/g, "-");
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safe}"`,
    },
  });
}

export async function buildRequirementPdf(input: RequirementPdfInput): Promise<Uint8Array> {
  const client = input.clientCompany || input.clientName;
  const pen = await startPdf(input.party, "Requirement", input.number, client, input.title, input.date);
  drawWrapped(pen, input.status, 10, muted, false, 10);
  pen.y -= 4;
  drawWrapped(pen, "Parties", 13, accent, true, 8);
  drawWrapped(pen, "Magpie Studio", 11, ink, true, 2);
  drawWrapped(pen, input.party.nameEn, 10, ink, false, 2);
  drawWrapped(pen, input.party.nameZh, 10, ink, false, 8);
  drawWrapped(pen, "Client", 11, ink, true, 2);
  drawWrapped(pen, input.clientCompany || input.clientName || "Client", 10, ink, false, 2);
  if (input.clientName && input.clientCompany) drawWrapped(pen, input.clientName, 10, ink, false, 8);
  else pen.y -= 6;
  for (const section of input.sections) {
    if (section.rows.length === 0) continue;
    pen.y -= 6;
    drawWrapped(pen, section.label, 13, accent, true, 8);
    for (const row of section.rows) {
      drawWrapped(pen, row.label, 10, ink, true, 3);
      drawWrapped(pen, row.value, 10, ink, false, 8);
    }
  }
  if (input.signature) {
    pen.y -= 6;
    drawRule(pen);
    drawWrapped(pen, "Signed", 13, accent, true, 6);
    drawWrapped(pen, input.signature.name, 12, ink, true, 3);
    drawWrapped(pen, input.signature.email, 10, ink, false, 3);
    drawWrapped(pen, input.signature.date, 10, muted, false, 3);
  }
  return finish(pen);
}

export async function buildLinesPdf(input: LinesPdfInput): Promise<Uint8Array> {
  const pen = await startPdf(input.party, input.documentName, input.number, input.client, input.project, input.date);
  const descWidth = 300;
  ensure(pen, 18);
  drawAt(pen.page, "Description", margin, pen.y - 10, 9, pen.bold, pen.cjk, muted);
  drawAt(pen.page, "Qty", margin + 320, pen.y - 10, 9, pen.bold, pen.cjk, muted);
  const amountHeader = "Amount";
  drawAt(
    pen.page,
    amountHeader,
    pageWidth - margin - pen.bold.widthOfTextAtSize(amountHeader, 9),
    pen.y - 10,
    9,
    pen.bold,
    pen.cjk,
    muted,
  );
  pen.y -= 16;
  drawRule(pen);
  for (const line of input.lines) {
    const wrapped = wrapParagraph(line.description, 10, descWidth, pen.latin, pen.cjk);
    const height = wrapped.length * 14 + 8;
    ensure(pen, height);
    wrapped.forEach((text, index) => {
      drawAt(pen.page, text, margin, pen.y - 11 - index * 14, 10, pen.latin, pen.cjk, ink);
    });
    drawAt(pen.page, line.quantity, margin + 320, pen.y - 11, 10, pen.latin, pen.cjk, ink);
    const amountWidth = widthOf(line.amount, 10, pen.bold, pen.cjk);
    drawAt(pen.page, line.amount, pageWidth - margin - amountWidth, pen.y - 11, 10, pen.bold, pen.cjk, ink);
    pen.y -= height;
  }
  drawRule(pen);
  const totalWidth = widthOf(input.total, 13, pen.bold, pen.cjk);
  ensure(pen, 20);
  drawAt(pen.page, input.total, pageWidth - margin - totalWidth, pen.y - 13, 13, pen.bold, pen.cjk, ink);
  pen.y -= 28;
  if (input.note) drawWrapped(pen, input.note, 10, muted, false, 6);
  if (input.payment) {
    pen.y -= 8;
    drawWrapped(pen, input.payment.title, 13, accent, true, 6);
    for (const line of input.payment.lines) drawWrapped(pen, line, 10, ink, false, 3);
    const image = input.payment.image;
    if (image && (image.mime === "image/png" || image.mime === "image/jpeg")) {
      try {
        const embedded = image.mime === "image/png" ? await pen.doc.embedPng(image.bytes) : await pen.doc.embedJpg(image.bytes);
        const height = Math.min(160, embedded.height);
        const width = Math.min(220, (embedded.width / embedded.height) * height);
        ensure(pen, height + 8);
        pen.page.drawImage(embedded, { x: margin, y: pen.y - height, width, height });
        pen.y -= height + 8;
      } catch {
        drawWrapped(pen, "The payment image is stored in Magpie Desk.", 10, muted, false, 4);
      }
    } else if (image) {
      drawWrapped(pen, "The payment image is stored in Magpie Desk.", 10, muted, false, 4);
    }
  }
  return finish(pen);
}
