import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from "pdf-lib";
import { company, paymentDefaults } from "@/content/company";

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 48;
const footerBand = 108;
const contentFloor = 126;
const accentStrong = rgb(0.29, 0.141, 0.463);
const ink = rgb(0.059, 0.059, 0.059);
const muted = rgb(0.42, 0.396, 0.376);
const accent = rgb(0.361, 0.176, 0.569);
const cream = rgb(0.965, 0.949, 0.918);
const white = rgb(1, 1, 1);
const rule = rgb(0.898, 0.875, 0.831);

export type PdfParty = {
  publicName: string;
  nameEn: string;
  nameZh: string;
  email: string;
  address: string;
};

export type PdfFooter = {
  companyName: string;
  nameEn: string;
  address: string;
  phone: string;
};

export function documentFooter(payments?: { companyName?: string; address?: string; phone?: string } | null): PdfFooter {
  return {
    companyName: payments?.companyName?.trim() || paymentDefaults.companyName,
    nameEn: company.nameEn,
    address: (payments?.address || paymentDefaults.address).replace(/\s*\n\s*/g, " ").trim(),
    phone: payments?.phone?.trim() || paymentDefaults.phone,
  };
}

function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "+8613620979734";
  if (digits.startsWith("86")) return `+${digits}`;
  return `+86${digits}`;
}

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
  footer?: PdfFooter;
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
  footer?: PdfFooter;
};

type Pen = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  latin: PDFFont;
  bold: PDFFont;
  cjk: PDFFont | null;
  logo: PDFImage | null;
  footer: PdfFooter;
  masthead: { title: string; number: string; date: string };
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
  if (pen.y - height >= contentFloor) return;
  turnPage(pen);
}

function turnPage(pen: Pen) {
  pen.page = pen.doc.addPage([pageWidth, pageHeight]);
  drawMasthead(pen, false);
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

function drawMasthead(pen: Pen, first: boolean) {
  const page = pen.page;
  const right = pageWidth - margin;
  const title = pen.masthead.title.toUpperCase();
  if (first) {
    page.drawRectangle({ x: 0, y: pageHeight - 118, width: pageWidth, height: 118, color: cream });
    page.drawRectangle({ x: 0, y: pageHeight - 124, width: pageWidth, height: 6, color: accent });
    if (pen.logo) {
      const height = 72;
      const width = (pen.logo.width / pen.logo.height) * height;
      page.drawImage(pen.logo, { x: margin, y: pageHeight - 24 - height, width, height });
    }
    drawAt(page, title, right - widthOf(title, 22, pen.bold, pen.cjk), pageHeight - 46, 22, pen.bold, pen.cjk, accent);
    drawAt(page, pen.masthead.number, right - widthOf(pen.masthead.number, 11, pen.bold, pen.cjk), pageHeight - 68, 11, pen.bold, pen.cjk, ink);
    drawAt(page, pen.masthead.date, right - widthOf(pen.masthead.date, 10, pen.latin, pen.cjk), pageHeight - 84, 10, pen.latin, pen.cjk, muted);
    pen.y = pageHeight - 146;
    return;
  }
  page.drawRectangle({ x: 0, y: pageHeight - 40, width: pageWidth, height: 40, color: cream });
  page.drawRectangle({ x: 0, y: pageHeight - 44, width: pageWidth, height: 4, color: accent });
  if (pen.logo) {
    const height = 22;
    const width = (pen.logo.width / pen.logo.height) * height;
    page.drawImage(pen.logo, { x: margin, y: pageHeight - 10 - height, width, height });
  }
  const label = `${title}  ${pen.masthead.number}`;
  drawAt(page, label, right - widthOf(label, 9, pen.bold, pen.cjk), pageHeight - 26, 9, pen.bold, pen.cjk, accent);
  pen.y = pageHeight - 60;
}

function footerAddressLines(address: string, width: number, latin: PDFFont, cjk: PDFFont | null): string[] {
  const splitAt = address.indexOf(" ");
  const phrases = splitAt > 8 ? [address.slice(0, splitAt), address.slice(splitAt + 1)] : [address];
  return phrases.flatMap((phrase) => wrapParagraph(phrase, 8, width, latin, cjk)).slice(0, 3);
}

function drawFooter(pen: Pen, page: PDFPage, index: number, total: number) {
  const bar = 20;
  page.drawRectangle({ x: 0, y: bar, width: pageWidth, height: footerBand - bar, color: cream });
  page.drawRectangle({ x: 0, y: footerBand - 3, width: pageWidth, height: 3, color: accent });
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: bar, color: accentStrong });

  const columns = [
    { x: 36, width: 176 },
    { x: 224, width: 196 },
    { x: 432, width: 128 },
  ];
  for (const edge of [216, 424]) {
    page.drawLine({
      start: { x: edge, y: 34 },
      end: { x: edge, y: footerBand - 16 },
      thickness: 0.6,
      color: rule,
    });
  }

  const phone = displayPhone(pen.footer.phone);
  const blocks = [
    { label: "COMPANY", lines: [pen.footer.companyName, pen.footer.nameEn] },
    { label: "ADDRESS", lines: footerAddressLines(pen.footer.address, columns[1].width, pen.latin, pen.cjk) },
    { label: "PHONE", lines: [phone, company.email] },
  ];
  blocks.forEach((block, blockIndex) => {
    const column = columns[blockIndex];
    drawAt(page, block.label, column.x, 86, 7, pen.bold, pen.cjk, accent);
    block.lines.forEach((line, lineIndex) => {
      const size = lineIndex === 0 ? 9 : 8;
      const font = lineIndex === 0 ? pen.bold : pen.latin;
      const color = lineIndex === 0 ? ink : muted;
      wrapParagraph(line, size, column.width, font, pen.cjk)
        .slice(0, 2)
        .forEach((text, wrapIndex) => {
          drawAt(page, text, column.x, 70 - lineIndex * 14 - wrapIndex * 11, size, font, pen.cjk, color);
        });
    });
  });

  const label = `${index + 1}  /  ${total}`;
  const labelWidth = pen.latin.widthOfTextAtSize(label, 8);
  page.drawText(label, {
    x: (pageWidth - labelWidth) / 2,
    y: 6,
    size: 8,
    font: pen.latin,
    color: white,
  });
}

async function openPen(input: { party: PdfParty; title: string; number: string; date: string; footer?: PdfFooter }): Promise<Pen> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${input.party.publicName} ${input.title} ${input.number}`);
  doc.setAuthor(input.party.nameEn);
  doc.registerFontkit((await loadFontkit()) as Parameters<PDFDocument["registerFontkit"]>[0]);
  const latin = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let cjk: PDFFont | null = null;
  try {
    cjk = await doc.embedFont(await readFile(path.join(process.cwd(), "src/fonts/wqy-microhei.ttf")), { subset: true });
  } catch {
    cjk = null;
  }
  let logo: PDFImage | null = null;
  try {
    logo = await doc.embedPng(await readFile(path.join(process.cwd(), "public/brand/magpie-logo-purple.png")));
  } catch {
    logo = null;
  }
  const pen: Pen = {
    doc,
    page: doc.addPage([pageWidth, pageHeight]),
    y: pageHeight - margin,
    latin,
    bold,
    cjk,
    logo,
    footer: input.footer ?? documentFooter(),
    masthead: { title: input.title, number: input.number, date: input.date },
  };
  drawMasthead(pen, true);
  return pen;
}

async function startPdf(party: PdfParty, documentName: string, number: string, client: string, project: string, date: string, footer?: PdfFooter) {
  const pen = await openPen({ party, title: documentName, number, date, footer });
  drawAt(pen.page, "PREPARED FOR", margin, pen.y, 8, pen.bold, pen.cjk, muted);
  pen.y -= 16;
  drawWrapped(pen, client || "Client", 13, ink, true, 3);
  if (project) drawWrapped(pen, project, 10, muted, false, 6);
  pen.y -= 6;
  return pen;
}

function finish(pen: Pen): Promise<Uint8Array> {
  const pages = pen.doc.getPages();
  pages.forEach((page, index) => drawFooter(pen, page, index, pages.length));
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
  const pen = await startPdf(input.party, "Requirement", input.number, client, input.title, input.date, input.footer);
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
    drawWrapped(pen, section.label, 13, accent, true, 4);
    pen.page.drawRectangle({ x: margin, y: pen.y + 2, width: 36, height: 2, color: accent });
    pen.y -= 8;
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

export type InvoicePdfInput = {
  party: PdfParty;
  number: string;
  date: string;
  purpose: string;
  title: string;
  clientName: string;
  clientCompany: string;
  currency: string;
  lines: { description: string; quantity: string; unit: string; discount: string; amount: string }[];
  subtotal: string;
  discount: string;
  saved: boolean;
  total: string;
  seller: { label: string; value: string }[];
  note: string;
  image?: { bytes: Uint8Array; mime: string } | null;
  footer?: PdfFooter;
};

export async function buildInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const pen = await openPen({ party: input.party, title: "Invoice", number: input.number, date: input.date, footer: input.footer });
  const { latin, bold, cjk } = pen;
  const page = pen.page;
  const brand = accent;
  const right = pageWidth - margin;

  const sellerValue = (label: string) => input.seller.find((item) => item.label === label)?.value ?? "";
  const billX = margin + 270;
  const columnWidth = 230;

  function stack(lines: string[], x: number, y: number, size: number, font: PDFFont, color: RGB) {
    let cursor = y;
    for (const source of lines) {
      if (!source.trim()) continue;
      for (const line of wrapParagraph(source, size, columnWidth, font, cjk)) {
        drawAt(page, line, x, cursor, size, font, cjk, color);
        cursor -= size + 3;
      }
      cursor -= 2;
    }
    return cursor;
  }

  drawAt(page, "FROM", margin, pen.y, 8, bold, cjk, muted);
  drawAt(page, "BILL TO", billX, pen.y, 8, bold, cjk, muted);
  const addressLines = sellerValue("Address")
    .split(/\n+/)
    .flatMap((line) => (line.length > 24 && line.includes(" ") ? line.split(/\s+/).filter(Boolean) : [line]));
  const fromBottom = stack(
    [
      sellerValue("Company") || input.party.nameZh,
      input.party.nameEn,
      ...addressLines,
      sellerValue("Phone") ? `Phone  ${sellerValue("Phone")}` : "",
      input.party.email,
    ],
    margin,
    pen.y - 16,
    9,
    latin,
    ink,
  );
  const billBottom = stack(
    [
      input.clientCompany || input.clientName || "Client",
      input.clientCompany && input.clientName ? input.clientName : "",
      input.purpose,
      input.title,
    ],
    billX,
    pen.y - 16,
    10,
    latin,
    ink,
  );
  pen.y = Math.min(fromBottom, billBottom) - 14;

  const descX = margin + 6;
  const descWidth = 200;
  const qtyX = margin + 214;
  const unitRight = margin + 338;
  const discountX = margin + 350;
  const amountRight = right - 6;

  function room(height: number) {
    if (pen.y - height >= contentFloor) return;
    turnPage(pen);
  }

  function tableHeader() {
    room(28);
    pen.page.drawRectangle({ x: margin, y: pen.y - 18, width: pageWidth - margin * 2, height: 22, color: brand });
    const size = 8;
    const baseline = pen.y - 13;
    drawAt(pen.page, "DESCRIPTION", descX, baseline, size, bold, cjk, white);
    drawAt(pen.page, "QTY", qtyX, baseline, size, bold, cjk, white);
    drawAt(pen.page, "UNIT", unitRight - widthOf("UNIT", size, bold, cjk), baseline, size, bold, cjk, white);
    drawAt(pen.page, "DISCOUNT", discountX, baseline, size, bold, cjk, white);
    drawAt(pen.page, "AMOUNT", amountRight - widthOf("AMOUNT", size, bold, cjk), baseline, size, bold, cjk, white);
    pen.y -= 26;
  }

  tableHeader();
  input.lines.forEach((line, index) => {
    const wrapped = wrapParagraph(line.description, 9, descWidth, latin, cjk);
    const height = Math.max(22, wrapped.length * 12 + 8);
    const pageBefore = pen.page;
    room(height + 4);
    if (pen.page !== pageBefore) tableHeader();
    if (index % 2 === 1) {
      pen.page.drawRectangle({ x: margin, y: pen.y - height + 4, width: pageWidth - margin * 2, height: height - 2, color: cream });
    }
    wrapped.forEach((text, lineIndex) => drawAt(pen.page, text, descX, pen.y - 12 - lineIndex * 12, 9, latin, cjk, ink));
    drawAt(pen.page, line.quantity, qtyX, pen.y - 12, 9, latin, cjk, ink);
    drawAt(pen.page, line.unit, unitRight - widthOf(line.unit, 9, latin, cjk), pen.y - 12, 9, latin, cjk, ink);
    drawAt(pen.page, line.discount, discountX, pen.y - 12, 9, line.discount === "0%" ? latin : bold, cjk, line.discount === "0%" ? muted : brand);
    drawAt(pen.page, line.amount, amountRight - widthOf(line.amount, 9, bold, cjk), pen.y - 12, 9, bold, cjk, ink);
    pen.y -= height;
  });

  pen.y -= 12;
  const totalRows: { label: string; value: string; strong?: boolean; save?: boolean }[] = [
    { label: "Subtotal", value: input.subtotal },
    { label: "Discount", value: `- ${input.discount}` },
  ];
  if (input.saved) totalRows.push({ label: "You save", value: input.discount, save: true });
  totalRows.push({ label: "Total", value: input.total, strong: true });
  const boxWidth = 230;
  const boxHeight = 12 + totalRows.length * 18;
  room(boxHeight + 8);
  pen.page.drawRectangle({
    x: right - boxWidth,
    y: pen.y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: cream,
    borderColor: brand,
    borderWidth: 1,
  });
  let rowY = pen.y - 16;
  for (const row of totalRows) {
    const size = row.strong ? 12 : 10;
    const font = row.strong || row.save ? bold : latin;
    const color = row.strong || row.save ? brand : ink;
    drawAt(pen.page, row.label, right - boxWidth + 10, rowY, size, font, cjk, row.strong ? ink : muted);
    drawAt(pen.page, row.value, right - 10 - widthOf(row.value, size, font, cjk), rowY, size, font, cjk, color);
    rowY -= 18;
  }
  pen.y -= boxHeight + 18;

  const payWidth = pageWidth - margin * 2;
  const valueWidth = payWidth - (input.image ? 150 : 20) - 100;
  const payLines = input.seller.flatMap((item) => wrapParagraph(item.value, 9, Math.max(160, valueWidth), latin, cjk).map((text, index) => ({ ...item, text, first: index === 0 })));
  const payHeight = 28 + payLines.length * 14 + 12;
  room(payHeight + 8);
  pen.page.drawRectangle({ x: margin, y: pen.y - payHeight, width: payWidth, height: payHeight, color: cream });
  drawAt(pen.page, "PAY TO", margin + 12, pen.y - 16, 8, bold, cjk, brand);
  let payY = pen.y - 34;
  for (const item of payLines) {
    if (item.first) drawAt(pen.page, item.label, margin + 12, payY, 9, latin, cjk, muted);
    drawAt(pen.page, item.text, margin + 112, payY, 9, latin, cjk, ink);
    payY -= 14;
  }
  const image = input.image;
  if (image && (image.mime === "image/png" || image.mime === "image/jpeg")) {
    try {
      const embedded = image.mime === "image/png" ? await pen.doc.embedPng(image.bytes) : await pen.doc.embedJpg(image.bytes);
      const height = Math.min(108, embedded.height, payHeight - 16);
      const width = Math.min(108, (embedded.width / embedded.height) * height);
      pen.page.drawImage(embedded, { x: right - width - 10, y: pen.y - payHeight + 10, width, height });
    } catch {
      drawAt(pen.page, "Company QR is stored in Magpie Desk.", right - 180, pen.y - 16, 8, latin, cjk, muted);
    }
  }
  pen.y -= payHeight + 14;
  if (input.note) drawWrapped(pen, input.note, 9, muted, false, 4);
  return finish(pen);
}

export async function buildContractPdf(input: {
  party: PdfParty;
  number: string;
  date: string;
  clientName: string;
  clientCompany: string;
  project: string;
  status: string;
  body: string;
  footer?: PdfFooter;
}): Promise<Uint8Array> {
  const client = input.clientCompany || input.clientName;
  const pen = await startPdf(input.party, "Contract", input.number, client, input.project, input.date, input.footer);
  drawWrapped(pen, input.status, 10, muted, false, 10);
  drawWrapped(pen, "Parties", 13, accent, true, 8);
  drawWrapped(pen, input.party.nameZh, 11, ink, true, 2);
  drawWrapped(pen, input.party.nameEn, 10, ink, false, 2);
  drawWrapped(pen, "Client", 11, ink, true, 8);
  drawWrapped(pen, client || "Client", 11, ink, true, 2);
  if (input.clientName && input.clientCompany) drawWrapped(pen, input.clientName, 10, ink, false, 8);
  else pen.y -= 6;
  drawWrapped(pen, "Agreement", 13, accent, true, 8);
  drawWrapped(pen, input.body, 10, ink, false, 4);
  return finish(pen);
}

export async function buildLinesPdf(input: LinesPdfInput): Promise<Uint8Array> {
  const pen = await startPdf(input.party, input.documentName, input.number, input.client, input.project, input.date, input.footer);
  const descWidth = 280;
  const qtyX = margin + 300;
  const amountRight = pageWidth - margin;
  ensure(pen, 28);
  pen.page.drawRectangle({ x: margin, y: pen.y - 18, width: pageWidth - margin * 2, height: 22, color: accent });
  drawAt(pen.page, "DESCRIPTION", margin + 6, pen.y - 13, 8, pen.bold, pen.cjk, white);
  drawAt(pen.page, "QTY", qtyX, pen.y - 13, 8, pen.bold, pen.cjk, white);
  drawAt(pen.page, "AMOUNT", amountRight - widthOf("AMOUNT", 8, pen.bold, pen.cjk) - 6, pen.y - 13, 8, pen.bold, pen.cjk, white);
  pen.y -= 26;
  input.lines.forEach((line, index) => {
    const wrapped = wrapParagraph(line.description, 10, descWidth, pen.latin, pen.cjk);
    const height = Math.max(22, wrapped.length * 13 + 8);
    ensure(pen, height);
    if (index % 2 === 1) {
      pen.page.drawRectangle({ x: margin, y: pen.y - height + 4, width: pageWidth - margin * 2, height: height - 2, color: cream });
    }
    wrapped.forEach((text, lineIndex) => {
      drawAt(pen.page, text, margin + 6, pen.y - 12 - lineIndex * 13, 10, pen.latin, pen.cjk, ink);
    });
    drawAt(pen.page, line.quantity, qtyX, pen.y - 12, 10, pen.latin, pen.cjk, ink);
    const amountWidth = widthOf(line.amount, 10, pen.bold, pen.cjk);
    drawAt(pen.page, line.amount, amountRight - amountWidth - 6, pen.y - 12, 10, pen.bold, pen.cjk, ink);
    pen.y -= height;
  });
  pen.y -= 12;
  ensure(pen, 28);
  const totalWidth = widthOf(input.total, 12, pen.bold, pen.cjk);
  pen.page.drawRectangle({ x: pageWidth - margin - totalWidth - 28, y: pen.y - 22, width: totalWidth + 28, height: 28, color: accent });
  drawAt(pen.page, input.total, pageWidth - margin - totalWidth - 14, pen.y - 16, 12, pen.bold, pen.cjk, white);
  pen.y -= 40;
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
