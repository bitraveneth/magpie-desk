import Link from "next/link";
import { PageTitle, StatusBadge, SampleNote } from "@/components/desk/DeskShell";
import { company } from "@/content/company";
import { deskStatus } from "@/lib/brief";
import { listNotices } from "@/lib/notices";
import { listPartners, listRequirements } from "@/lib/queries";
import { money, shanghaiDate } from "@/lib/money";
import { commissionTotals } from "@/lib/commission";

export default async function HomePage() {
  const [jobs, partners, notices] = await Promise.all([listRequirements(), listPartners(), listNotices()]);
  const counts = [
    ["Requirements", jobs.length],
    ["Filled", jobs.filter((job) => job.briefStatus !== "SENT").length],
    ["Signed contracts", jobs.filter((job) => job.quotation?.contract?.status === "SIGNED").length],
    ["Paid invoices", jobs.filter((job) => job.quotation?.contract?.invoice?.status === "PAID").length],
  ] as const;

  return (
    <>
      <PageTitle
        kicker={company.publicName}
        title="Paperwork, in order."
        text="Take a brief from requirement to quotation, contract, and invoice. A filled brief shows up here so you can review it, send it back, or confirm it."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {counts.map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-[#e6e8ef] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-muted">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          </article>
        ))}
      </div>
      {notices.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-accent/20 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Needs a look</h2>
          <ul className="mt-3 divide-y divide-[#e6e8ef]">
            {notices.map((notice) => (
              <li key={notice.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold">{notice.message}</p>
                  <p className="text-xs text-muted">{notice.requirement.number} · {shanghaiDate(notice.createdAt)}</p>
                </div>
                <Link href={`/requirements/${notice.requirement.id}`} className="text-sm font-semibold text-accent">
                  View
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="mt-6 overflow-hidden rounded-2xl border border-[#e6e8ef] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e8ef] px-5 py-4">
          <h2 className="text-lg font-semibold">Recent requirements</h2>
          <div className="flex gap-4 text-sm font-semibold">
            <Link href="/requirements/questions" className="text-accent">Questions</Link>
            <Link href="/requirements/new" className="text-accent">New requirement</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
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
              {jobs.slice(0, 8).map((job) => (
                <tr key={job.id} className="border-t border-[#e6e8ef]">
                  <td className="px-5 py-4">
                    <Link href={`/requirements/${job.id}`} className="font-semibold hover:text-accent">{job.title}</Link>
                    <p className="text-xs text-muted">{job.number}{job.sample ? " · Sample" : ""}</p>
                  </td>
                  <td className="px-5 py-4 text-muted">{job.clientName}</td>
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
      </section>
      <section className="mt-6 overflow-hidden rounded-2xl border border-[#e6e8ef] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e6e8ef] px-5 py-4">
          <h2 className="text-lg font-semibold">Partners</h2>
          <Link href="/partners/new" className="text-sm font-semibold text-accent">New partner</Link>
        </div>
        <ul>
          {partners.map((partner) => {
            const totals = commissionTotals(partner.commissionRate, partner.requirements);
            return (
              <li key={partner.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e6e8ef] px-5 py-4">
                <div>
                  <Link href={`/partners/${partner.id}`} className="font-semibold hover:text-accent">{partner.name}</Link>
                  <SampleNote sample={partner.sample} />
                </div>
                <p className="text-sm text-muted">
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
