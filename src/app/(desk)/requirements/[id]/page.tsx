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
import { createQuotation, offerNda, setRequirementStatus, updateRequirement } from "@/lib/mutations";
import { getJob, origin } from "@/lib/queries";
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
  const link = `${await origin()}/r/${job.shareToken}`;

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
        <Badge>{job.status === "READY" ? "Ready" : "Draft"}</Badge>
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
            <p className="mt-2 text-sm text-muted">Anyone with this link can read the brief, update it, and sign in.</p>
            <div className="mt-4">
              <CopyLink url={link} label="Requirement link" />
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Status</h2>
            <form action={setRequirementStatus} className="mt-4">
              <input type="hidden" name="id" value={job.id} />
              <input type="hidden" name="status" value={job.status === "READY" ? "DRAFT" : "READY"} />
              <Button type="submit" variant="outline" disabled={job.status === "READY" && Boolean(job.quotation)}>
                {job.status === "READY" ? "Move back to draft" : "Mark ready"}
              </Button>
            </form>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Sign-in and NDA</h2>
            <p className="mt-2 text-sm text-muted">
              {job.signedInAt
                ? `${job.signedInName} signed in at ${shanghaiDate(job.signedInAt)}.`
                : "Nobody has signed in on the requirement link yet."}
            </p>
            <p className="mt-2 text-sm text-muted">
              {job.nda?.status === "SIGNED"
                ? `NDA ${job.nda.number} signed by ${job.nda.signerName}.`
                : job.nda
                  ? `NDA ${job.nda.number} is offered. The client can sign it when they sign in.`
                  : "No NDA yet. Offer one if the client should have the choice to sign it."}
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
        ) : job.status === "READY" ? (
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
          <p className="mt-3 text-sm text-muted">Mark the requirement ready before starting a quotation.</p>
        )}
      </Card>
    </>
  );
}
