import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Banner, PageTitle, SampleNote, StatusBadge } from "@/components/desk/DeskShell";
import { Chain } from "@/components/desk/Chain";
import { CopyLink } from "@/components/desk/CopyLink";
import { quoteTemplates } from "@/content/company";
import { company } from "@/content/company";
import { deskStatus } from "@/lib/brief";
import { createQuotation, deleteRequirement, offerNda, confirmRequirement, returnForCorrection, updateRequirement } from "@/lib/mutations";
import { PaperActions } from "@/components/desk/RowActions";
import { markRequirementNoticesRead } from "@/lib/notices";
import { answeredSections } from "@/lib/requirement-document";
import { getJob, listQuestions, origin } from "@/lib/queries";
import { money, shanghaiDate } from "@/lib/money";

const fieldClass = "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-500";

export default async function RequirementDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const messages = await searchParams;
  const job = await getJob(id);
  if (!job) notFound();
  await markRequirementNoticesRead(id);
  const questions = await listQuestions();
  const review = answeredSections({ questions, answers: job.answers, files: job.files });
  const link = `${await origin()}/r/${job.shareToken}`;
  const filled = job.briefStatus !== "SENT";
  const signedCopy = job.files.find((file) => file.questionId === "__signed_copy");
  const client = [job.clientCompany, job.clientName].filter(Boolean).join(" · ");

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <PageTitle kicker={job.number} title={job.title} />
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={deskStatus(job)} />
          <SampleNote sample={job.sample} />
          <Button href={link} variant="outline" className="px-4 py-2">
            Open link
          </Button>
          <PaperActions
            pdfHref={`/requirements/${job.id}/pdf`}
            action={deleteRequirement}
            id={job.id}
            confirmText={`Delete requirement ${job.number}? Its quotation and contract go with it. The invoice stays.`}
          />
        </div>
      </div>
      <Banner error={messages.error} notice={messages.notice} />
      <Chain
        current="requirement"
        requirementId={job.id}
        quotationId={job.quotation?.id}
        contractId={job.quotation?.contract?.id}
        invoiceId={job.quotation?.contract?.invoice?.id}
      />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-800">Client</h2>
          <form action={updateRequirement} className="mt-4 grid gap-3">
            <input type="hidden" name="id" value={job.id} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Name</span>
              <input name="clientName" defaultValue={job.clientName} required className={fieldClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Email</span>
              <input name="clientEmail" type="email" defaultValue={job.clientEmail} className={fieldClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Company</span>
              <input name="clientCompany" defaultValue={job.clientCompany} className={fieldClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Project</span>
              <input name="title" defaultValue={job.title} required className={fieldClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Summary</span>
              <textarea name="summary" rows={4} defaultValue={job.summary} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-500" />
            </label>
            <div className="flex justify-end">
              <Button type="submit">Save</Button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Send to the client</h2>
            <p className="mt-1 text-sm text-gray-500">They answer, download the PDF, and can sign on this link.</p>
            <div className="mt-3">
              <CopyLink url={link} label="Requirement link" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="font-semibold text-gray-800">PDF</h3>
              <p className="mt-1 text-sm text-gray-500">
                {company.publicName} and {client || "the client"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {job.briefStatus === "SIGNED" && job.signedInAt
                  ? `Signed by ${job.signedInName} · ${shanghaiDate(job.signedInAt)}`
                  : filled
                    ? "Questionnaire submitted"
                    : "Waiting for the client"}
              </p>
            </div>
            <div className="flex gap-2">
              {signedCopy ? (
                <Button href={`/requirements/${job.id}/signed`} variant="outline" className="px-4 py-2">
                  Signed file
                </Button>
              ) : null}
              <Button href={`/requirements/${job.id}/pdf`} variant="outline" className="px-4 py-2">
                Download
              </Button>
            </div>
          </div>

          {job.quotation ? null : filled ? (
            <form action={returnForCorrection} className="grid gap-3 border-b border-gray-100 px-5 py-4">
              <input type="hidden" name="id" value={job.id} />
              <div>
                <h3 className="font-semibold text-gray-800">Send back</h3>
                <p className="mt-1 text-sm text-gray-500">The same link opens again for a correction.</p>
              </div>
              <textarea
                name="note"
                rows={2}
                defaultValue={job.correctionNote}
                placeholder="What should they correct?"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-500"
              />
              <div className="flex justify-end">
                <Button type="submit" variant="outline" className="px-4 py-2">
                  Resend
                </Button>
              </div>
            </form>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="font-semibold text-gray-800">Sign and NDA</h3>
              <p className="mt-1 text-sm text-gray-500">
                {job.signedInAt ? `${job.signedInName} signed · ${shanghaiDate(job.signedInAt)}` : "Not signed yet"}
                {" · "}
                {job.nda?.status === "SIGNED"
                  ? `NDA signed by ${job.nda.signerName}`
                  : job.nda
                    ? `NDA ${job.nda.number} offered`
                    : "No NDA"}
              </p>
            </div>
            {job.briefStatus === "SIGNED" && !job.confirmedAt ? (
              <form action={confirmRequirement}>
                <input type="hidden" name="id" value={job.id} />
                <Button type="submit" className="px-4 py-2">
                  Confirm
                </Button>
              </form>
            ) : job.nda ? null : (
              <form action={offerNda}>
                <input type="hidden" name="id" value={job.id} />
                <Button type="submit" variant="outline" className="px-4 py-2">
                  Offer NDA
                </Button>
              </form>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <h3 className="font-semibold text-gray-800">Quotation</h3>
              <p className="mt-1 text-sm text-gray-500">
                {job.quotation
                  ? job.quotation.number
                  : job.confirmedAt
                    ? "Ready to price"
                    : filled
                      ? "Opens after the client signs and you confirm"
                      : "Opens after the client fills, signs, and you confirm"}
              </p>
            </div>
            {job.quotation ? (
              <Button href={`/quotations/${job.quotation.id}`} className="px-4 py-2">
                Open
              </Button>
            ) : job.confirmedAt ? (
              <form action={createQuotation}>
                <input type="hidden" name="requirementId" value={job.id} />
                <Button type="submit" className="px-4 py-2">
                  New quotation
                </Button>
              </form>
            ) : null}
          </div>
          {job.confirmedAt && !job.quotation ? (
            <div className="flex flex-wrap gap-2 border-t border-gray-100 px-5 py-4">
              {quoteTemplates.map((template) => (
                <form key={template.id} action={createQuotation}>
                  <input type="hidden" name="requirementId" value={job.id} />
                  <input type="hidden" name="templateId" value={template.id} />
                  <Button type="submit" variant="outline" className="px-3 py-2">
                    {template.name} · {money(template.amount, "USD")}
                  </Button>
                </form>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Answers</h2>
          <Button href="/requirements/questions" variant="outline" className="px-4 py-2">
            Edit questions
          </Button>
        </header>
        {review.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">No answers yet.</p>
        ) : (
          review.map((section) => (
            <div key={section.id} className="border-b border-gray-100 px-5 py-4 last:border-b-0">
              <h3 className="text-xs font-semibold tracking-[0.14em] text-gray-400 uppercase">{section.label}</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {section.rows.map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs text-gray-500">{row.label}</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-800">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))
        )}
      </section>
    </>
  );
}
