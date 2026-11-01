import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Banner, Field, PageTitle } from "@/components/desk/DeskShell";
import { company } from "@/content/company";
import { signInToRequirement, updatePublicBrief } from "@/lib/mutations";
import { ndaBody } from "@/lib/nda-text";
import { shanghaiDate } from "@/lib/money";
import { getJobByToken } from "@/lib/queries";

export default async function SharedRequirementPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { token } = await params;
  const messages = await searchParams;
  const job = await getJobByToken(token);
  if (!job) notFound();
  const ndaSigned = job.nda?.status === "SIGNED";
  const ndaText = job.nda?.body ?? ndaBody(job);

  return (
    <>
      <PageTitle kicker={company.publicName} title={job.title} text="This is your requirement with Magpie Studio. It is not a partner link." />
      <Banner error={messages.error} notice={messages.notice} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Your brief</h2>
          <form action={updatePublicBrief} className="mt-4 grid gap-4">
            <input type="hidden" name="token" value={job.shareToken} />
            <Field label="Your name">
              <Input name="clientName" defaultValue={job.clientName} required />
            </Field>
            <Field label="Email">
              <Input name="clientEmail" type="email" defaultValue={job.clientEmail} />
            </Field>
            <Field label="Company">
              <Input name="clientCompany" defaultValue={job.clientCompany} />
            </Field>
            <Field label="Project title">
              <Input name="title" defaultValue={job.title} required />
            </Field>
            <Field label="What you need">
              <Textarea name="summary" rows={6} defaultValue={job.summary} />
            </Field>
            <Button type="submit">Save brief</Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Sign in</h2>
          {job.signedInAt ? (
            <p className="mt-2 text-sm text-muted">
              Signed in as {job.signedInName} · {shanghaiDate(job.signedInAt)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Sign in with your name and email so Magpie knows who opened this brief.</p>
          )}
          {ndaSigned ? (
            <div className="mt-4">
              <Badge>NDA signed</Badge>
              <p className="mt-3 text-sm text-muted">
                {job.nda?.number} signed by {job.nda?.signerName}
                {job.nda?.signedAt ? ` on ${shanghaiDate(job.nda.signedAt)}` : ""}.
              </p>
              <pre className="mt-4 whitespace-pre-wrap text-sm leading-6">{job.nda?.body}</pre>
            </div>
          ) : (
            <form action={signInToRequirement} className="mt-4 grid gap-4">
              <input type="hidden" name="token" value={job.shareToken} />
              <Field label="Name">
                <Input name="name" defaultValue={job.signedInName ?? job.clientName} required />
              </Field>
              <Field label="Email">
                <Input name="email" type="email" defaultValue={job.signedInEmail ?? job.clientEmail} required />
              </Field>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="signNda" value="yes" className="mt-1" />
                <span>I want to sign the NDA. Leave this unchecked to sign in without it.</span>
              </label>
              {job.nda ? <Badge>NDA {job.nda.number} is ready to sign</Badge> : null}
              <pre className="whitespace-pre-wrap rounded-2xl border border-border bg-background p-4 text-sm leading-6">{ndaText}</pre>
              <Button type="submit">Sign in</Button>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
