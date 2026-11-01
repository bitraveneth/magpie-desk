"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { quoteTemplates } from "@/content/company";
import { prisma } from "@/lib/db";
import { forgetReads } from "@/lib/read-cache";
import { currencyCode } from "@/lib/money";
import { ndaBody } from "@/lib/nda-text";
import {
  contractCompanyName,
  ensureDesk,
  getCompany,
  warmDeskReads,
  takeDocumentNumber,
  takeInvoiceNumber,
  takeShareToken,
  takeShortNumber,
} from "@/lib/queries";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function done(path: string, notice: string): never {
  forgetReads();
  void warmDeskReads();
  revalidatePath("/", "layout");
  redirect(`${path}?notice=${encodeURIComponent(notice)}`);
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

async function partnerCode(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "partner";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await prisma.partner.findUnique({ where: { code } });
    if (!existing) return code;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function createRequirement(formData: FormData) {
  const clientName = text(formData, "clientName");
  const title = text(formData, "title");
  const partnerCodeValue = text(formData, "partnerCode");
  const returnPath = partnerCodeValue ? `/p/${partnerCodeValue}` : "/requirements/new";
  if (!clientName || !title) fail(returnPath, "Client name and title are required.");

  const partner = partnerCodeValue
    ? await prisma.partner.findUnique({ where: { code: partnerCodeValue } })
    : null;
  if (partnerCodeValue && !partner) fail(`/p/${partnerCodeValue}`, "That partner link is no longer active.");

  const shareToken = await takeShareToken();
  const requirement = await prisma.requirement.create({
    data: {
      number: await takeShortNumber("REQ"),
      shareToken,
      clientName,
      clientEmail: text(formData, "clientEmail"),
      clientCompany: text(formData, "clientCompany"),
      title,
      summary: text(formData, "summary"),
      partnerId: partner?.id,
    },
  });

  if (partner) done(`/r/${shareToken}`, "Requirement started from the partner link.");
  done(`/requirements/${requirement.id}`, "Requirement saved.");
}

export async function updateRequirement(formData: FormData) {
  const id = text(formData, "id");
  const job = await prisma.requirement.findUnique({ where: { id } });
  if (!job) fail("/requirements", "Requirement not found.");
  const clientName = text(formData, "clientName");
  const title = text(formData, "title");
  if (!clientName || !title) fail(`/requirements/${id}`, "Client name and title are required.");

  await prisma.requirement.update({
    where: { id },
    data: {
      clientName,
      clientEmail: text(formData, "clientEmail"),
      clientCompany: text(formData, "clientCompany"),
      title,
      summary: text(formData, "summary"),
    },
  });
  done(`/requirements/${id}`, "Requirement updated.");
}

export async function updatePublicBrief(formData: FormData) {
  const token = text(formData, "token");
  const job = await prisma.requirement.findUnique({ where: { shareToken: token } });
  if (!job) fail("/", "This requirement link is not active.");
  const clientName = text(formData, "clientName");
  const title = text(formData, "title");
  if (!clientName || !title) fail(`/r/${token}`, "Name and project title are required.");

  await prisma.requirement.update({
    where: { id: job.id },
    data: {
      clientName,
      clientEmail: text(formData, "clientEmail"),
      clientCompany: text(formData, "clientCompany"),
      title,
      summary: text(formData, "summary"),
    },
  });
  done(`/r/${token}`, "Brief saved.");
}

export async function setRequirementStatus(formData: FormData) {
  const id = text(formData, "id");
  const status = text(formData, "status");
  const job = await prisma.requirement.findUnique({
    where: { id },
    include: { quotation: true },
  });
  if (!job) fail("/requirements", "Requirement not found.");
  if (status === "DRAFT" && job.quotation) {
    fail(`/requirements/${id}`, "A requirement with a quotation stays ready.");
  }
  if (status !== "DRAFT" && status !== "READY") fail(`/requirements/${id}`, "Unknown status.");
  await prisma.requirement.update({ where: { id }, data: { status } });
  done(`/requirements/${id}`, status === "READY" ? "Requirement marked ready." : "Requirement moved back to draft.");
}

export async function createQuotation(formData: FormData) {
  const requirementId = text(formData, "requirementId");
  const templateId = text(formData, "templateId");
  const job = await prisma.requirement.findUnique({
    where: { id: requirementId },
    include: { quotation: true },
  });
  if (!job) fail("/requirements", "Requirement not found.");
  if (job.briefStatus === "SENT") {
    fail(`/requirements/${job.id}`, "The client has to fill the requirement before a quotation.");
  }
  if (!job.confirmedAt) {
    fail(`/requirements/${job.id}`, "Confirm the signed requirement before a quotation.");
  }
  if (job.quotation) fail(`/quotations/${job.quotation.id}`, "This requirement already has a quotation.");

  const template = quoteTemplates.find((item) => item.id === templateId);
  const quotation = await prisma.quotation.create({
    data: {
      number: await takeShortNumber("QUO"),
      requirementId: job.id,
      currency: "USD",
      lines: {
        create: template
          ? {
              description: `${template.name} — ${template.detail}`,
              quantity: 1,
              unitAmount: template.amount,
              sort: 0,
            }
          : { description: "Project work", quantity: 1, unitAmount: 0, sort: 0 },
      },
    },
  });
  done(`/quotations/${quotation.id}`, template ? `${template.name} template added.` : "Quotation started.");
}

export async function createDeskQuotation(formData: FormData) {
  const clientName = text(formData, "clientName");
  const clientCompany = text(formData, "clientCompany");
  const title = text(formData, "title");
  if (!clientName && !clientCompany) fail("/quotations/new", "Add the other company or a client name.");
  if (!title) fail("/quotations/new", "Add what this quotation is for.");

  const requirement = await prisma.requirement.create({
    data: {
      number: await takeShortNumber("REQ"),
      shareToken: await takeShareToken(),
      clientName,
      clientEmail: "",
      clientCompany,
      title,
      summary: "Opened from the quotations desk.",
      status: "READY",
      briefStatus: "FILLED",
      confirmedAt: new Date(),
    },
  });
  const quotation = await prisma.quotation.create({
    data: {
      number: await takeShortNumber("QUO"),
      requirementId: requirement.id,
      currency: currencyCode(text(formData, "currency") || "CNY"),
      lines: { create: [{ description: title, quantity: 1, unitAmount: 0, sort: 0 }] },
    },
  });
  done(`/quotations/${quotation.id}`, "Quotation created. Add the line items you need.");
}

export async function returnForCorrection(formData: FormData) {
  const id = text(formData, "id");
  const note = text(formData, "note");
  const job = await prisma.requirement.findUnique({
    where: { id },
    include: { quotation: true },
  });
  if (!job) fail("/requirements", "Requirement not found.");
  if (job.quotation) fail(`/requirements/${id}`, "A quotation is already open, so this brief stays locked.");
  if (job.briefStatus === "SENT") fail(`/requirements/${id}`, "The client has not submitted this brief yet.");
  await prisma.$transaction([
    prisma.requirementFile.deleteMany({ where: { requirementId: id, questionId: "__signed_copy" } }),
    prisma.requirement.update({
      where: { id },
      data: {
        briefStatus: "SENT",
        status: "DRAFT",
        confirmedAt: null,
        signedInName: null,
        signedInEmail: null,
        signedInAt: null,
        correctionNote: note || "Please review the answers and submit the brief again.",
      },
    }),
  ]);
  done(`/requirements/${id}`, "Sent back for correction. The same link is open again.");
}

export async function confirmRequirement(formData: FormData) {
  const id = text(formData, "id");
  const job = await prisma.requirement.findUnique({ where: { id }, include: { quotation: true } });
  if (!job) fail("/requirements", "Requirement not found.");
  if (job.briefStatus !== "SIGNED") {
    fail(`/requirements/${id}`, "The client signs the requirement before you confirm it.");
  }
  if (job.confirmedAt) done(`/requirements/${id}`, "This requirement is already confirmed.");
  await prisma.requirement.update({ where: { id }, data: { confirmedAt: new Date(), status: "READY" } });
  done(`/requirements/${id}`, "Confirmed. You can send the quotation.");
}

export async function saveQuotation(formData: FormData) {
  const id = text(formData, "id");
  const quotation = await prisma.quotation.findUnique({ where: { id } });
  if (!quotation) fail("/requirements", "Quotation not found.");
  if (quotation.status !== "DRAFT") fail(`/quotations/${id}`, "Accepted quotations stay locked.");

  const descriptions = formData.getAll("description").map((value) => String(value).trim());
  const quantities = formData.getAll("quantity").map((value) => Number(value));
  const amounts = formData.getAll("unitAmount").map((value) => Number(value));
  const lines = descriptions
    .map((description, index) => ({
      description,
      quantity: quantities[index],
      unitAmount: amounts[index],
      sort: index,
    }))
    .filter((line) => line.description);

  if (lines.length === 0) fail(`/quotations/${id}`, "Add at least one line with a description.");
  if (lines.some((line) => !Number.isFinite(line.quantity) || line.quantity <= 0)) {
    fail(`/quotations/${id}`, "Quantity must be greater than zero.");
  }
  if (lines.some((line) => !Number.isFinite(line.unitAmount) || line.unitAmount < 0)) {
    fail(`/quotations/${id}`, "Amounts cannot be negative.");
  }

  await prisma.$transaction([
    prisma.quotationLine.deleteMany({ where: { quotationId: id } }),
    prisma.quotation.update({
      where: { id },
      data: {
        currency: currencyCode(text(formData, "currency")),
        lines: { create: lines },
      },
    }),
  ]);
  done(`/quotations/${id}`, "Quotation saved.");
}

export async function applyQuoteTemplate(formData: FormData) {
  const id = text(formData, "id");
  const template = quoteTemplates.find((item) => item.id === text(formData, "templateId"));
  const quotation = await prisma.quotation.findUnique({ where: { id } });
  if (!quotation) fail("/requirements", "Quotation not found.");
  if (!template) fail(`/quotations/${id}`, "Choose a price card.");
  if (quotation.status !== "DRAFT") fail(`/quotations/${id}`, "Accepted quotations stay locked.");

  await prisma.$transaction([
    prisma.quotationLine.deleteMany({ where: { quotationId: id } }),
    prisma.quotation.update({
      where: { id },
      data: {
        currency: "USD",
        lines: {
          create: {
            description: `${template.name} — ${template.detail}`,
            quantity: 1,
            unitAmount: template.amount,
            sort: 0,
          },
        },
      },
    }),
  ]);
  done(`/quotations/${id}`, `${template.name} lines replaced the quotation.`);
}

export async function setQuotationStatus(formData: FormData) {
  const id = text(formData, "id");
  const status = text(formData, "status");
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { lines: true, contract: true },
  });
  if (!quotation) fail("/requirements", "Quotation not found.");
  if (quotation.contract) fail(`/contracts/${quotation.contract.id}`, "This quotation already has a contract.");
  if (status === "ACCEPTED" && quotation.lines.length === 0) {
    fail(`/quotations/${id}`, "Add a line before accepting.");
  }
  if (status === "DRAFT" && quotation.status !== "DECLINED") {
    fail(`/quotations/${id}`, "Only a declined quotation can be reopened.");
  }
  if (status !== "DRAFT" && status !== "ACCEPTED" && status !== "DECLINED") {
    fail(`/quotations/${id}`, "Unknown status.");
  }
  if ((status === "ACCEPTED" || status === "DECLINED") && quotation.status !== "DRAFT") {
    fail(`/quotations/${id}`, "This quotation is already decided.");
  }
  await prisma.quotation.update({ where: { id }, data: { status } });
  done(
    `/quotations/${id}`,
    status === "ACCEPTED" ? "Quotation accepted." : status === "DECLINED" ? "Quotation declined." : "Quotation reopened.",
  );
}

function agreementBody(input: {
  clientName: string;
  clientCompany: string;
  title: string;
  summary: string;
  currency: string;
  lines: { description: string; quantity: { toString(): string }; unitAmount: { toString(): string } }[];
  companyEn: string;
  companyZh: string;
  address: string;
  email: string;
}): string {
  const lines = input.lines
    .map((line) => {
      const quantity = Number(line.quantity);
      const unit = Number(line.unitAmount);
      const total = Math.round(quantity * unit * 100) / 100;
      return `- ${line.description}: ${quantity} × ${input.currency} ${unit.toFixed(2)} = ${input.currency} ${total.toFixed(2)}`;
    })
    .join("\n");
  const total = input.lines.reduce((sum, line) => {
    return sum + Math.round(Number(line.quantity) * Number(line.unitAmount) * 100) / 100;
  }, 0);
  const client = input.clientCompany.trim()
    ? `${input.clientName} (${input.clientCompany.trim()})`
    : input.clientName;

  return [
    "Service agreement",
    "",
    `Between ${input.companyEn} (${input.companyZh}) and ${client}.`,
    "",
    `Project: ${input.title}`,
    input.summary.trim() ? `Scope: ${input.summary.trim()}` : "",
    "",
    `Fees (${input.currency})`,
    lines,
    `Total: ${input.currency} ${total.toFixed(2)}`,
    "",
    "Work begins after this agreement is signed. The invoice that follows uses these fees.",
    "",
    input.companyEn,
    input.address.replaceAll("\n", ", "),
    input.email,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export async function createContract(formData: FormData) {
  const quotationId = text(formData, "quotationId");
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { lines: { orderBy: { sort: "asc" } }, requirement: true, contract: true },
  });
  if (!quotation) fail("/requirements", "Quotation not found.");
  if (quotation.status !== "ACCEPTED") fail(`/quotations/${quotation.id}`, "Accept the quotation before a contract.");
  if (quotation.contract) fail(`/contracts/${quotation.contract.id}`, "This quotation already has a contract.");

  const profile = await getCompany();
  const number = await takeDocumentNumber(
    contractCompanyName(quotation.requirement.clientCompany, profile.publicName),
  );
  const contract = await prisma.contract.create({
    data: {
      number,
      quotationId: quotation.id,
      body: agreementBody({
        clientName: quotation.requirement.clientName,
        clientCompany: quotation.requirement.clientCompany,
        title: quotation.requirement.title,
        summary: quotation.requirement.summary,
        currency: quotation.currency,
        lines: quotation.lines,
        companyEn: profile.nameEn,
        companyZh: profile.nameZh,
        address: profile.address,
        email: profile.email,
      }),
    },
  });
  done(`/contracts/${contract.id}`, `Contract ${number} created.`);
}

export async function saveContract(formData: FormData) {
  const id = text(formData, "id");
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) fail("/requirements", "Contract not found.");
  if (contract.status !== "DRAFT") fail(`/contracts/${id}`, "A signed contract stays locked.");
  const body = text(formData, "body");
  if (!body) fail(`/contracts/${id}`, "The contract needs text.");
  await prisma.contract.update({ where: { id }, data: { body } });
  done(`/contracts/${id}`, "Contract saved.");
}

export async function signContract(formData: FormData) {
  const id = text(formData, "id");
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) fail("/requirements", "Contract not found.");
  if (contract.status !== "DRAFT") fail(`/contracts/${id}`, "This contract is already signed.");
  await prisma.contract.update({
    where: { id },
    data: { status: "SIGNED", signedAt: new Date() },
  });
  done(`/contracts/${id}`, "Contract signed.");
}

const invoicePurposes = new Set(["WEB", "PRODUCT", "TRADING"]);

function invoiceLines(formData: FormData) {
  const descriptions = formData.getAll("description").map((value) => String(value).trim());
  const quantities = formData.getAll("quantity").map((value) => Number(value));
  const amounts = formData.getAll("unitAmount").map((value) => Number(value));
  const discounts = formData.getAll("discountRate").map((value) => Number(value));
  return descriptions
    .map((description, index) => ({
      description,
      quantity: quantities[index],
      unitAmount: amounts[index],
      discountRate: Math.min(100, Math.max(0, Number.isFinite(discounts[index]) ? discounts[index] : 0)),
      sort: index,
    }))
    .filter((line) => line.description);
}

export async function createInvoice(formData: FormData) {
  const contractId = text(formData, "contractId");
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      invoice: true,
      quotation: { include: { lines: { orderBy: { sort: "asc" } }, requirement: true } },
    },
  });
  if (!contract) fail("/requirements", "Contract not found.");
  if (contract.status !== "SIGNED") fail(`/contracts/${contract.id}`, "Sign the contract before an invoice.");
  if (contract.invoice) fail(`/invoices/${contract.invoice.id}`, "This contract already has an invoice.");
  const client = contract.quotation.requirement;

  const invoice = await prisma.invoice.create({
    data: {
      number: await takeInvoiceNumber(client.clientCompany || client.clientName),
      contractId: contract.id,
      purpose: "WEB",
      clientName: client.clientName,
      clientCompany: client.clientCompany,
      title: client.title,
      currency: contract.quotation.currency,
      lines: {
        create: contract.quotation.lines.map((line) => ({
          description: line.description,
          quantity: line.quantity,
          unitAmount: line.unitAmount,
          sort: line.sort,
        })),
      },
    },
  });
  done(`/invoices/${invoice.id}`, "Invoice created.");
}

export async function createDeskInvoice(formData: FormData) {
  const purpose = text(formData, "purpose");
  const clientName = text(formData, "clientName");
  const clientCompany = text(formData, "clientCompany");
  const title = text(formData, "title");
  if (!invoicePurposes.has(purpose)) fail("/invoices/new", "Choose what this invoice is for.");
  if (!clientName && !clientCompany) fail("/invoices/new", "Add the other company or a client name.");

  const invoice = await prisma.invoice.create({
    data: {
      number: await takeInvoiceNumber(clientCompany || clientName),
      purpose,
      clientName,
      clientCompany,
      title,
      currency: currencyCode(text(formData, "currency") || "CNY"),
      lines: {
        create: [{ description: title || "Item", quantity: 1, unitAmount: 0, sort: 0 }],
      },
    },
  });
  done(`/invoices/${invoice.id}`, "Invoice created. Add the line items you need.");
}

export async function saveInvoice(formData: FormData) {
  const id = text(formData, "id");
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) fail("/invoices", "Invoice not found.");
  if (invoice.status === "PAID") fail(`/invoices/${id}`, "A paid invoice stays locked.");
  const purpose = text(formData, "purpose");
  if (!invoicePurposes.has(purpose)) fail(`/invoices/${id}`, "Choose what this invoice is for.");
  const lines = invoiceLines(formData);
  if (lines.length === 0) fail(`/invoices/${id}`, "Add at least one line with a description.");
  if (lines.some((line) => !Number.isFinite(line.quantity) || line.quantity <= 0)) {
    fail(`/invoices/${id}`, "Quantity must be greater than zero.");
  }
  if (lines.some((line) => !Number.isFinite(line.unitAmount) || line.unitAmount < 0)) {
    fail(`/invoices/${id}`, "Amounts cannot be negative.");
  }
  if (lines.some((line) => line.discountRate < 0 || line.discountRate > 100)) {
    fail(`/invoices/${id}`, "Discount is a percent from 0 to 100.");
  }

  await prisma.invoiceLine.deleteMany({ where: { invoiceId: id } });
  await prisma.invoice.update({
    where: { id },
    data: {
      purpose,
      clientName: text(formData, "clientName"),
      clientCompany: text(formData, "clientCompany"),
      title: text(formData, "title"),
      currency: currencyCode(text(formData, "currency")),
      lines: { create: lines },
    },
  });
  done(`/invoices/${id}`, "Invoice saved.");
}

export async function setPaymentMethod(formData: FormData) {
  const id = text(formData, "id");
  const method = text(formData, "paymentMethod");
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) fail("/requirements", "Invoice not found.");
  if (invoice.status === "PAID") fail(`/invoices/${id}`, "A paid invoice keeps its payment instruction.");
  if (method !== "COMPANY_QR" && method !== "BANK_SLIP") {
    fail(`/invoices/${id}`, "Choose the company QR or the bank slip.");
  }
  await prisma.invoice.update({ where: { id }, data: { paymentMethod: method } });
  done(`/invoices/${id}`, method === "COMPANY_QR" ? "Invoice will show the company QR." : "Bank details stay on the invoice. The QR is hidden.");
}

export async function issueInvoice(formData: FormData) {
  const id = text(formData, "id");
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) fail("/requirements", "Invoice not found.");
  if (invoice.status !== "DRAFT") fail(`/invoices/${id}`, "This invoice is already issued.");
  await prisma.invoice.update({
    where: { id },
    data: { status: "ISSUED", issuedAt: new Date() },
  });
  done(`/invoices/${id}`, "Invoice issued.");
}

export async function markInvoicePaid(formData: FormData) {
  const id = text(formData, "id");
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) fail("/requirements", "Invoice not found.");
  if (invoice.status !== "ISSUED") fail(`/invoices/${id}`, "Issue the invoice before marking it paid.");
  await prisma.invoice.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });
  done(`/invoices/${id}`, "Invoice marked paid.");
}

export async function savePayments(formData: FormData) {
  await ensureDesk();
  await prisma.paymentSettings.update({
    where: { id: "payments" },
    data: {
      companyName: text(formData, "companyName"),
      taxNumber: text(formData, "taxNumber"),
      address: text(formData, "address"),
      phone: text(formData, "phone"),
    },
  });
  done("/settings/payments", "Company details saved.");
}

function bankLine(account: { bankName: string; branchName: string }) {
  return [account.bankName, account.branchName].filter(Boolean).join("");
}

async function copyBankToSettings(account: { bankName: string; branchName: string; accountName: string; accountNumber: string }) {
  await prisma.paymentSettings.update({
    where: { id: "payments" },
    data: {
      bankName: bankLine(account),
      accountName: account.accountName,
      accountNumber: account.accountNumber,
    },
  });
}

export async function addBankAccount(formData: FormData) {
  await ensureDesk();
  const bankName = text(formData, "bankName");
  const branchName = text(formData, "branchName");
  const accountName = text(formData, "accountName");
  const accountNumber = text(formData, "accountNumber");
  if (!bankName || !branchName || !accountNumber) fail("/settings/payments", "Add the bank, the branch, and the account number.");
  const payments = await prisma.paymentSettings.findUnique({ where: { id: "payments" } });
  const existing = await prisma.bankAccount.count();
  const account = await prisma.bankAccount.create({
    data: {
      bankName,
      branchName,
      accountName: accountName || payments?.companyName || bankName,
      accountNumber,
      isDefault: existing === 0,
    },
  });
  if (account.isDefault) await copyBankToSettings(account);
  done("/settings/payments", "Bank account added.");
}

export async function useBankAccount(formData: FormData) {
  await ensureDesk();
  const id = text(formData, "id");
  const account = await prisma.bankAccount.findUnique({ where: { id } });
  if (!account) fail("/settings/payments", "Bank account not found.");
  await prisma.bankAccount.updateMany({ data: { isDefault: false } });
  await prisma.bankAccount.update({ where: { id }, data: { isDefault: true } });
  await copyBankToSettings(account);
  done("/settings/payments", "Invoices will use this bank account.");
}

export async function createPartner(formData: FormData) {
  const name = text(formData, "name");
  if (!name) fail("/partners/new", "Partner name is required.");
  const rateText = text(formData, "commissionRate");
  let commissionRate: number | null = null;
  if (rateText) {
    commissionRate = Number(rateText);
    if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      fail("/partners/new", "Commission rate is a percent from 0 to 100.");
    }
  }
  const partner = await prisma.partner.create({
    data: { name, code: await partnerCode(name), commissionRate },
  });
  done(`/partners/${partner.id}`, "Partner created.");
}

export async function updatePartner(formData: FormData) {
  const id = text(formData, "id");
  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) fail("/partners", "Partner not found.");
  const rateText = text(formData, "commissionRate");
  let commissionRate: number | null = null;
  if (rateText) {
    commissionRate = Number(rateText);
    if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      fail(`/partners/${id}`, "Commission rate is a percent from 0 to 100.");
    }
  }
  await prisma.partner.update({
    where: { id },
    data: { name: text(formData, "name") || partner.name, commissionRate },
  });
  done(`/partners/${id}`, "Partner updated.");
}

export async function offerNda(formData: FormData) {
  const id = text(formData, "id");
  const job = await prisma.requirement.findUnique({ where: { id }, include: { nda: true } });
  if (!job) fail("/requirements", "Requirement not found.");
  if (job.nda) done(`/requirements/${id}`, "An NDA is already on this requirement.");
  const profile = await getCompany();
  await prisma.nda.create({
    data: {
      number: await takeDocumentNumber(contractCompanyName(job.clientCompany, profile.publicName), "NDA"),
      requirementId: job.id,
      body: ndaBody(job),
      status: "OFFERED",
    },
  });
  done(`/requirements/${id}`, "NDA offered. The client can sign it when they sign in.");
}

export async function signInToRequirement(formData: FormData) {
  const token = text(formData, "token");
  const job = await prisma.requirement.findUnique({
    where: { shareToken: token },
    include: { nda: true },
  });
  if (!job) fail("/", "This requirement link is not active.");
  const name = text(formData, "name");
  const email = text(formData, "email");
  if (!name || !email || !email.includes("@")) {
    fail(`/r/${token}`, "Sign in with your name and email.");
  }

  const wantsNda = text(formData, "signNda") === "yes";
  await prisma.requirement.update({
    where: { id: job.id },
    data: {
      signedInName: name,
      signedInEmail: email,
      signedInAt: new Date(),
      clientName: job.clientName.trim() ? job.clientName : name,
      clientEmail: job.clientEmail.trim() ? job.clientEmail : email,
    },
  });

  if (wantsNda) {
    if (job.nda?.status === "SIGNED") {
      done(`/r/${token}`, "You are signed in. The NDA was already signed.");
    }
    const profile = await getCompany();
    const body = job.nda?.body || ndaBody({ ...job, clientName: name });
    const number =
      job.nda?.number ||
      (await takeDocumentNumber(contractCompanyName(job.clientCompany, profile.publicName), "NDA"));
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
    done(`/r/${token}`, "You are signed in and the NDA is signed.");
  }

  done(`/r/${token}`, "You are signed in. The NDA was left unsigned.");
}
