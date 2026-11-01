import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Banner, PageTitle, SampleNote, StatusBadge } from "@/components/desk/DeskShell";
import { deskStatus } from "@/lib/brief";
import { listRequirements } from "@/lib/queries";
import { shanghaiDate } from "@/lib/money";

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const messages = await searchParams;
  const jobs = await listRequirements();

  return (
    <>
      <PageTitle kicker="Requirements" title="Briefs" text="Open a filled brief to review it, download the PDF, send it back, or confirm it." />
      <Banner error={messages.error} notice={messages.notice} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Button href="/requirements/new">New requirement</Button>
        <Button href="/requirements/questions" variant="outline">Edit questions</Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#e6e8ef] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#f8f9fc] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Project</th>
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Stage</th>
                <th className="px-5 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-[#e6e8ef]">
                  <td className="px-5 py-4">
                    <Link href={`/requirements/${job.id}`} className="font-semibold hover:text-accent">{job.title}</Link>
                    <p className="mt-1 text-xs text-muted">{job.number}</p>
                    <div className="mt-2"><SampleNote sample={job.sample} /></div>
                  </td>
                  <td className="px-5 py-4">
                    <p>{job.clientName}</p>
                    <p className="text-xs text-muted">{job.clientCompany}</p>
                  </td>
                  <td className="px-5 py-4"><StatusBadge label={deskStatus(job)} /></td>
                  <td className="px-5 py-4 text-muted">{shanghaiDate(job.updatedAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/requirements/${job.id}`} className="font-semibold text-accent">View</Link>
                    <Link href={`/requirements/${job.id}/pdf`} className="ml-4 font-semibold text-accent">PDF</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
