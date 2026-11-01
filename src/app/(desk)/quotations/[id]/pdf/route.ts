import { company } from "@/content/company";
import { money, shanghaiDay, sumLines } from "@/lib/money";
import { buildLinesPdf, pdfResponse } from "@/lib/pdf";
import { getJobByQuotation } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await getJobByQuotation(id);
  const quotation = job?.quotation;
  if (!job || !quotation || quotation.id !== id) return new Response("Not found", { status: 404 });
  const total = sumLines(quotation.lines);
  const bytes = await buildLinesPdf({
    party: company,
    documentName: "Quotation",
    number: quotation.number,
    client: job.clientCompany || job.clientName,
    project: job.title,
    date: shanghaiDay(quotation.createdAt),
    lines: quotation.lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity).toString(),
      amount: money(Number(line.quantity) * Number(line.unitAmount), quotation.currency),
    })),
    total: `Total ${money(total, quotation.currency)}`,
    note: "This quotation is the price. Work starts after it is accepted and the contract is signed.",
  });
  return pdfResponse(bytes, `${quotation.number}.pdf`);
}
