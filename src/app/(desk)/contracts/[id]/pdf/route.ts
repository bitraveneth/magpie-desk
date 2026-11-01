import { company } from "@/content/company";
import { shanghaiDay } from "@/lib/money";
import { buildContractPdf, documentFooter, pdfResponse } from "@/lib/pdf";
import { getJobByContract, getPayments } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await getJobByContract(id);
  const contract = job?.quotation?.contract;
  if (!job || !job.quotation || !contract || contract.id !== id) return new Response("Not found", { status: 404 });
  const payments = await getPayments();
  const bytes = await buildContractPdf({
    party: company,
    number: contract.number,
    date: shanghaiDay(contract.signedAt ?? contract.createdAt),
    clientName: job.clientName,
    clientCompany: job.clientCompany,
    project: job.title,
    status: contract.status === "SIGNED" ? "Signed" : "Draft",
    body: contract.body,
    footer: documentFooter(payments),
  });
  return pdfResponse(bytes, `${contract.number}.pdf`);
}
