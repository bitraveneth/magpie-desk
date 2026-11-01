import { company } from "@/content/company";
import { shanghaiDate, shanghaiDay } from "@/lib/money";
import { buildRequirementPdf, documentFooter, pdfResponse } from "@/lib/pdf";
import { requirementPdfInput } from "@/lib/requirement-document";
import { getJob, getPayments, listQuestions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await getJob(id);
  if (!job) return new Response("Not found", { status: 404 });
  const questions = await listQuestions();
  const payments = await getPayments();
  const bytes = await buildRequirementPdf({
    ...requirementPdfInput({
      party: company,
      number: job.number,
      title: job.title,
      clientName: job.clientName,
      clientCompany: job.clientCompany,
      date: shanghaiDay(job.updatedAt),
      briefStatus: job.briefStatus,
      signedInName: job.signedInName,
      signedInEmail: job.signedInEmail,
      signedInAt: job.signedInAt ? shanghaiDate(job.signedInAt) : null,
      questions,
      answers: job.answers,
      files: job.files,
    }),
    footer: documentFooter(payments),
  });
  return pdfResponse(bytes, `${job.number}.pdf`);
}
