import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Banner, PageTitle, SampleNote } from "@/components/desk/DeskShell";
import { commissionTotals } from "@/lib/commission";
import { money } from "@/lib/money";
import { listPartners, origin } from "@/lib/queries";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const messages = await searchParams;
  const partners = await listPartners();
  const base = await origin();

  return (
    <>
      <PageTitle
        kicker="Partners"
        title="Partner links"
        text="A partner link starts a new requirement for that partner. It is separate from the link you send for a requirement."
      />
      <Banner error={messages.error} notice={messages.notice} />
      <div className="mb-4">
        <Button href="/partners/new">New partner</Button>
      </div>
      <div className="grid gap-4">
        {partners.map((partner) => {
          const totals = commissionTotals(partner.commissionRate, partner.requirements);
          return (
            <Card key={partner.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <SampleNote sample={partner.sample} />
                    <Badge>
                      {partner.commissionRate == null ? "Rate not set" : `${Number(partner.commissionRate)}%`}
                    </Badge>
                  </div>
                  <Link href={`/partners/${partner.id}`} className="text-xl font-semibold hover:text-accent">
                    {partner.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">{base}/p/{partner.code}</p>
                  <p className="mt-1 text-sm text-muted">
                    {totals
                      ? totals.length
                        ? `Commission ${totals.map(([currency, amount]) => money(amount, currency)).join(", ")}`
                        : "No paid invoices yet"
                      : "Set a rate to calculate commission"}
                  </p>
                </div>
                <Button href={`/partners/${partner.id}`} variant="outline">
                  Open
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
