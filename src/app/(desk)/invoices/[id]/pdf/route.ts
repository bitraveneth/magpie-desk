import { company } from "@/content/company";
import { discountedLine, money, shanghaiDay, invoiceTotals } from "@/lib/money";
import { buildInvoicePdf, pdfResponse } from "@/lib/pdf";
import { getInvoiceRecord, getPayments, invoiceParties } from "@/lib/queries";

export const dynamic = "force-dynamic";

const purposeLabel: Record<string, string> = {
  WEB: "Web development",
  PRODUCT: "Product purchase",
  TRADING: "Trading",
};

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const invoice = await getInvoiceRecord(id);
  if (!invoice) return new Response("Not found", { status: 404 });
  const payments = await getPayments();
  const party = invoiceParties(invoice);
  const totals = invoiceTotals(invoice.lines);
  const method = invoice.paymentMethod;
  const image =
    method === "COMPANY_QR" && payments.qrImage
      ? { bytes: new Uint8Array(payments.qrImage), mime: payments.qrMime || "image/png" }
      : null;

  const bytes = await buildInvoicePdf({
    party: company,
    number: invoice.number,
    date: shanghaiDay(invoice.issuedAt ?? invoice.createdAt),
    purpose: purposeLabel[invoice.purpose] ?? invoice.purpose,
    title: party.title,
    clientName: party.clientName,
    clientCompany: party.clientCompany,
    currency: invoice.currency,
    lines: invoice.lines.map((line) => {
      const priced = discountedLine(line.quantity, line.unitAmount, line.discountRate);
      return {
        description: line.description,
        quantity: Number(line.quantity).toString(),
        unit: money(Number(line.unitAmount), invoice.currency),
        discount: `${priced.rate}%`,
        amount: money(priced.net, invoice.currency),
      };
    }),
    subtotal: money(totals.subtotal, invoice.currency),
    discount: money(totals.discount, invoice.currency),
    saved: totals.discount > 0,
    total: money(totals.total, invoice.currency),
    seller: [
      { label: "Company", value: payments.companyName },
      { label: "Tax number", value: payments.taxNumber },
      { label: "Address", value: payments.address },
      { label: "Phone", value: payments.phone },
      { label: "Email", value: company.email },
      { label: "Bank", value: payments.bankName },
      { label: "Account name", value: payments.accountName },
      { label: "Account number", value: payments.accountNumber },
    ],
    note: invoice.status === "PAID" ? "Paid." : invoice.status === "ISSUED" ? "Issued." : "Draft.",
    image,
  });
  return pdfResponse(bytes, `${invoice.number}.pdf`);
}
