import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Banner, PageTitle, SampleNote } from "@/components/desk/DeskShell";
import { listRequirements } from "@/lib/queries";

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const messages = await searchParams;
  const jobs = await listRequirements();

  return (
    <>
      <PageTitle kicker="Requirements" title="Briefs" text="A requirement can be sent on its own link. A partner is optional." />
      <Banner error={messages.error} notice={messages.notice} />
      <div className="mb-4">
        <Button href="/requirements/new">New requirement</Button>
      </div>
      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge>{job.status === "READY" ? "Ready" : "Draft"}</Badge>
                  <SampleNote sample={job.sample} />
                  {job.partner ? <Badge>Partner: {job.partner.name}</Badge> : null}
                  {job.nda?.status === "SIGNED" ? <Badge>NDA signed</Badge> : null}
                </div>
                <Link href={`/requirements/${job.id}`} className="text-xl font-semibold hover:text-accent">
                  {job.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {job.number} · {job.clientName}
                  {job.clientCompany ? ` · ${job.clientCompany}` : ""}
                </p>
              </div>
              <Button href={`/requirements/${job.id}`} variant="outline">
                Open
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
