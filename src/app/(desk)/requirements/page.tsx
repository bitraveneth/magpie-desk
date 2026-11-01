import Link from "next/link";
import { Banner, PageTitle } from "@/components/desk/DeskShell";
import { RequirementsTable } from "@/components/desk/RequirementsTable";
import { listRequirements } from "@/lib/queries";

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; q?: string }>;
}) {
  const messages = await searchParams;
  const query = (messages.q ?? "").trim();
  const needle = query.toLowerCase();
  const jobs = (await listRequirements()).filter((job) => {
    if (!needle) return true;
    return [job.title, job.clientName, job.clientCompany, job.number, job.clientEmail].join(" ").toLowerCase().includes(needle);
  });

  return (
    <>
      <PageTitle kicker="Requirements" title="Requirements" text="Open a filled brief to review it, download the PDF, send it back, or confirm it." />
      <Banner error={messages.error} notice={messages.notice} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <form action="/requirements" className="w-full max-w-md">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search requirements"
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none"
          />
        </form>
        <div className="flex items-center gap-3">
          <Link href="/requirements/questions" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
            Edit questions
          </Link>
          <Link href="/requirements/new" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            New requirement
          </Link>
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{query ? `Results for “${query}”` : "All requirements"}</h2>
        </div>
        <RequirementsTable jobs={jobs} empty={query ? "No requirements match that search." : "No requirements yet."} />
      </section>
    </>
  );
}
