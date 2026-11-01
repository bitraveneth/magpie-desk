import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Banner, Field, PageTitle, SampleNote } from "@/components/desk/DeskShell";
import { Chain } from "@/components/desk/Chain";
import { CopyLink } from "@/components/desk/CopyLink";
import { quoteTemplates } from "@/content/company";
import { briefLabel } from "@/lib/brief";
import { createQuotation, offerNda, updateRequirement } from "@/lib/mutations";
import { answeredSections } from "@/lib/requirement-document";
import { getJob, listQuestions, origin } from "@/lib/queries";
import { shanghaiDate } from "@/lib/money";

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
  const questions = await listQuestions();
  const review = answeredSections({ questions, answers: job.answers, files: job.files });
  const link = `${await origin()}/r/${job.shareToken}`;
  const filled = job.briefStatus !== "SENT";

  return (
    <>
      <PageTitle kicker={job.number} title={job.title} text="Send this requirement link when the brief is for the client. Use a partner link only when the lead comes from a partner." />
      <Banner error={messages.error} notice={messages.notice} />
      <Chain
        current="requirement"
        requirementId={job.id}
        quotationId={job.quotation?.id}
        contractId={job.quotation?.contract?.id}
        invoiceId={job.quotation?.contract?.invoice?.id}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge>{briefLabel(job.briefStatus)}</Badge>
        <SampleNote sample={job.sample} />
        {job.partner ? <Badge>Partner: {job.partner.name}</Badge> : <Badge>No partner</Badge>}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <form action={updateRequirement} className="grid gap-4">
            <input type="hidden" name="id" value={job.id} />
            <Field label="Client name">
              <Input name="clientName" defaultValue={job.clientName} required />
            </Field>
            <Field label="Client email">
              <Input name="clientEmail" type="email" defaultValue={job.clientEmail} />
            </Field>
            <Field label="Client company">
              <Input name="clientCompany" defaultValue={job.clientCompany} />
            </Field>
            <Field label="Project title">
              <Input name="title" defaultValue={job.title} required />
            </Field>
            <Field label="Summary">
              <Textarea name="summary" rows={5} defaultValue={job.summary} />
            </Field>
            <Button type="submit">Save brief</Button>
          </form>
        </Card>
        <div className="grid gap-6">
          <Card>
            <h2 className="text-lg font-semibold">Requirement link</h2>
            <p className="mt-2 text-sm text-muted">Send this link to the client. They fill the questionnaire, download the PDF, and can sign it.</p>
            <div className="mt-4">
              <CopyLink url={link} label="Requirement link" />
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Requirement PDF</h2>
            <p className="mt-2 text-sm text-muted">
              {job.briefStatus === "SIGNED" && job.signedInAt
                ? `Signed by ${job.signedInName} on ${shanghaiDate(job.signedInAt)}.`
                : filled
                  ? "The client has submitted the questionnaire."
                  : "The PDF fills in as the client answers. It picks up the signature after they sign."}
            </p>
            <div className="mt-4">
              <Button href={`/requirements/${job.id}/pdf`} variant="outline">
                Download PDF
              </Button>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Sign-in and NDA</h2>
            <p className="mt-2 text-sm text-muted">
              {job.signedInAt
                ? `${job.signedInName} signed in at ${shanghaiDate(job.signedInAt)}.`
                : "The client has not signed the requirement yet."}
            </p>
            <p className="mt-2 text-sm text-muted">
              {job.nda?.status === "SIGNED"
                ? `NDA ${job.nda.number} signed by ${job.nda.signerName}.`
                : job.nda
                  ? `NDA ${job.nda.number} is offered. The client can sign it when they sign in.`
                  : "No NDA yet. Offer one if the client should be able to sign it with the requirement."}
            </p>
            {job.nda ? (
              <pre className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground">{job.nda.body}</pre>
            ) : (
              <form action={offerNda} className="mt-4">
                <input type="hidden" name="id" value={job.id} />
                <Button type="submit" variant="outline">
                  Offer NDA
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
      <Card className="mt-6">
        <h2 className="text-lg font-semibold">Quotation</h2>
        {job.quotation ? (
          <div className="mt-4">
            <Button href={`/quotations/${job.quotation.id}`}>Open {job.quotation.number}</Button>
          </div>
        ) : filled ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={createQuotation}>
              <input type="hidden" name="requirementId" value={job.id} />
              <Button type="submit" variant="outline">
                Blank quotation
              </Button>
            </form>
            {quoteTemplates.map((template) => (
              <form key={template.id} action={createQuotation}>
                <input type="hidden" name="requirementId" value={job.id} />
                <input type="hidden" name="templateId" value={template.id} />
                <Button type="submit" variant="ghost">
                  {template.name} · USD {template.amount.toLocaleString("en-US")} / {template.cadence}
                </Button>
              </form>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">The client fills the questionnaire on the requirement link. A quotation opens after they submit.</p>
        )}
      </Card>
      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Questionnaire</h2>
          <Button href="/requirements/questions" variant="ghost">
            Edit questions
          </Button>
        </div>
        {review.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No answers yet.</p>
        ) : (
          <div className="mt-6 grid gap-5">
            {review.map((section) => (
              <section key={section.id}>
                <h3 className="font-semibold text-accent">{section.label}</h3>
                <div className="mt-3 grid gap-3">
                  {section.rows.map((row) => (
                    <div key={row.label}>
                      <p className="text-sm font-semibold">{row.label}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">{row.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
