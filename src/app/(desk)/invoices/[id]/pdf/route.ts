import { company } from "@/content/company";
import { money, shanghaiDay, sumLines } from "@/lib/money";
import { buildLinesPdf, pdfResponse } from "@/lib/pdf";
import { getJobByInvoice, getPayments } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await getJobByInvoice(id);
  const invoice = job?.quotation?.contract?.invoice;
  if (!job || !invoice || invoice.id !== id) return new Response("Not found", { status: 404 });
  const payments = await getPayments();
  const total = sumLines(invoice.lines);
  const method = invoice.paymentMethod;
  const payment =
    method === "COMPANY_QR"
      ? {
          title: "Pay with the company QR",
          lines: payments.qrImage ? [] : ["The company QR has not been uploaded yet."],
          image: payments.qrImage ? { bytes: new Uint8Array(payments.qrImage), mime: payments.qrMime || "image/png" } : null,
        }
      : method === "BANK_SLIP"
        ? {
            title: "Pay with the bank slip",
            lines: [
              payments.bankName ? `Bank: ${payments.bankName}` : "",
              payments.accountName ? `Account name: ${payments.accountName}` : "",
              payments.accountNumber ? `Account number: ${payments.accountNumber}` : "",
            ].filter(Boolean),
            image: payments.slipImage ? { bytes: new Uint8Array(payments.slipImage), mime: payments.slipMime || "image/png" } : null,
          }
        : { title: "Payment", lines: ["A payment method has not been chosen yet."], image: null };

  const bytes = await buildLinesPdf({
    party: company,
    documentName: "Invoice",
    number: invoice.number,
    client: job.clientCompany || job.clientName,
    project: job.title,
    date: shanghaiDay(invoice.issuedAt ?? invoice.createdAt),
    lines: invoice.lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity).toString(),
      amount: money(Number(line.quantity) * Number(line.unitAmount), invoice.currency),
    })),
    total: `Total ${money(total, invoice.currency)}`,
    note: invoice.status === "PAID" ? "Paid." : invoice.status === "ISSUED" ? "Issued." : "Draft.",
    payment,
  });
  return pdfResponse(bytes, `${invoice.number}.pdf`);
}
