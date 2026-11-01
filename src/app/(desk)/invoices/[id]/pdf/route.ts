import { company } from "@/content/company";
import { money, shanghaiDay, sumLines } from "@/lib/money";
import { buildLinesPdf, pdfResponse } from "@/lib/pdf";
import { getInvoiceRecord, getPayments, invoiceParties, paymentDetailLines } from "@/lib/queries";

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
  const total = sumLines(invoice.lines);
  const method = invoice.paymentMethod;
  const image =
    method === "COMPANY_QR" && payments.qrImage
      ? { bytes: new Uint8Array(payments.qrImage), mime: payments.qrMime || "image/png" }
      : method === "BANK_SLIP" && payments.slipImage
        ? { bytes: new Uint8Array(payments.slipImage), mime: payments.slipMime || "image/png" }
        : null;

  const bytes = await buildLinesPdf({
    party: company,
    documentName: "Invoice",
    number: invoice.number,
    client: party.clientCompany || party.clientName,
    project: [purposeLabel[invoice.purpose], party.title].filter(Boolean).join(" · "),
    date: shanghaiDay(invoice.issuedAt ?? invoice.createdAt),
    lines: invoice.lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity).toString(),
      amount: money(Number(line.quantity) * Number(line.unitAmount), invoice.currency),
    })),
    total: `Total ${money(total, invoice.currency)}`,
    note: invoice.status === "PAID" ? "Paid." : invoice.status === "ISSUED" ? "Issued." : "Draft.",
    payment: { title: "Pay to", lines: paymentDetailLines(payments), image },
  });
  return pdfResponse(bytes, `${invoice.number}.pdf`);
}
