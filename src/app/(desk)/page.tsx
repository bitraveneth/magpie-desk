import Link from "next/link";
import { PageTitle } from "@/components/desk/DeskShell";
import { RequirementsTable } from "@/components/desk/RequirementsTable";
import { listPartners, listRequirements } from "@/lib/queries";
import { money } from "@/lib/money";
import { commissionTotals } from "@/lib/commission";

const metricIcons = {
  requirements: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.5 4.25h5.2l3.05 3.05V19.75a1 1 0 0 1-1 1h-7.25a1 1 0 0 1-1-1V5.25a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 4.25V7.5h3.25M8.75 12h6.5M8.75 15.5h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  filled: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21.072V11.029m0 0c-.23 0-.46-.053-.67-.159m.67.159c.23 0 .46-.053.671-.159m0 0a1.5 1.5 0 01-1.341 0m1.341 0l7.55-3.774M11.33 10.87L3.78 7.096m16.441 0a1.499 1.499 0 00-.592-.533L12.67 3.084a1.5 1.5 0 00-1.341 0L4.372 6.563c-.247.123-.45.309-.592.533m16.441 0a1.5 1.5 0 01.237.808v8.19a1.5 1.5 0 01-.83 1.341l-6.957 3.479a1.5 1.5 0 01-1.341 0l-6.958-3.479a1.5 1.5 0 01-.829-1.342V7.904c0-.292.085-.571.237-.808" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  contracts: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 12.2 11 14.7 15.7 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  invoices: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15.484 7.723a2.613 2.613 0 00-2.613-2.613h-1.057a3.298 3.298 0 00-1.158 6.386l2.688 1.009a3.298 3.298 0 01-1.158 6.386H11.13a2.613 2.613 0 01-2.613-2.613M12 19.283v1.925m0-18.416v1.925" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default async function HomePage() {
  const [jobs, partners] = await Promise.all([listRequirements(), listPartners()]);
  const counts = [
    ["Requirements", jobs.length, metricIcons.requirements],
    ["Filled", jobs.filter((job) => job.briefStatus !== "SENT").length, metricIcons.filled],
    ["Signed contracts", jobs.filter((job) => job.quotation?.contract?.status === "SIGNED").length, metricIcons.contracts],
    ["Paid invoices", jobs.filter((job) => job.quotation?.contract?.invoice?.status === "PAID").length, metricIcons.invoices],
  ] as const;

  return (
    <>
      <PageTitle
        kicker="Dashboard"
        title="Dashboard"
        text="Review a filled brief, send it back, or confirm it before a quotation."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        {counts.map(([label, value, icon]) => (
          <article key={label} className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-800 [&>svg]:size-6">{icon}</div>
            <div className="mt-5">
              <span className="text-sm text-gray-500">{label}</span>
              <h2 className="mt-2 text-title-sm font-bold text-gray-800">{value}</h2>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Recent requirements</h2>
          <div className="flex items-center gap-3">
            <Link href="/requirements" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
              See all
            </Link>
            <Link href="/requirements/new" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
              New requirement
            </Link>
          </div>
        </div>
        <RequirementsTable jobs={jobs.slice(0, 8)} />
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Partners</h2>
          <Link href="/partners/new" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
            New partner
          </Link>
        </div>
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {partners.map((partner) => {
            const totals = commissionTotals(partner.commissionRate, partner.requirements);
            return (
              <li key={partner.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/partners/${partner.id}`} className="text-sm font-medium text-gray-800 hover:text-brand-500">
                    {partner.name}
                  </Link>
                  {partner.sample ? <p className="text-xs text-gray-500">Sample</p> : null}
                </div>
                <p className="text-sm text-gray-500">
                  {totals
                    ? totals.length
                      ? totals.map(([currency, amount]) => money(amount, currency)).join(", ")
                      : "No paid invoices yet"
                    : "Set a commission rate"}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
