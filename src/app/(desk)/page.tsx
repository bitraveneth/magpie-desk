import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageTitle } from "@/components/desk/DeskShell";
import { company } from "@/content/company";
import { briefLabel } from "@/lib/brief";
import { listPartners, listRequirements } from "@/lib/queries";
import { money } from "@/lib/money";
import { commissionTotals } from "@/lib/commission";

export default async function HomePage() {
  const [jobs, partners] = await Promise.all([listRequirements(), listPartners()]);
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
        text="Take a brief from requirement to quotation, contract, and invoice. Send a requirement link on its own, or start from a partner link when the lead comes from a partner."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm font-medium text-muted">{label}</p>
            <p className="display mt-2 text-4xl">{value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Recent requirements</h2>
            <span className="flex gap-4">
              <Link href="/requirements/questions" className="text-sm font-semibold text-accent">
                Questions
              </Link>
              <Link href="/requirements/new" className="text-sm font-semibold text-accent">
                New requirement
              </Link>
            </span>
          </div>
          <ul className="grid gap-3">
            {jobs.slice(0, 6).map((job) => (
              <li key={job.id} className="flex items-start justify-between gap-3 border-t border-border pt-3">
                <div>
                  <Link href={`/requirements/${job.id}`} className="font-semibold hover:text-accent">
                    {job.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {job.number} · {job.clientName}
                    {job.sample ? " · Sample" : ""}
                  </p>
                </div>
                <span className="text-sm text-muted">{briefLabel(job.briefStatus)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Partners</h2>
            <Link href="/partners/new" className="text-sm font-semibold text-accent">
              New partner
            </Link>
          </div>
          <ul className="grid gap-3">
            {partners.map((partner) => {
              const totals = commissionTotals(partner.commissionRate, partner.requirements);
              return (
                <li key={partner.id} className="border-t border-border pt-3">
                  <Link href={`/partners/${partner.id}`} className="font-semibold hover:text-accent">
                    {partner.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {totals
                      ? totals.length
                        ? totals.map(([currency, amount]) => money(amount, currency)).join(", ")
                        : "No paid invoices yet"
                      : "Set a commission rate"}
                    {partner.sample ? " · Sample" : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
