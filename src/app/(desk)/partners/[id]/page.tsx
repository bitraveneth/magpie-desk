import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Banner, Field, PageTitle, SampleNote } from "@/components/desk/DeskShell";
import { CopyLink } from "@/components/desk/CopyLink";
import { commissionTotals } from "@/lib/commission";
import { DeleteButton } from "@/components/desk/DeleteButton";
import { deletePartner, updatePartner } from "@/lib/mutations";
import { money, sumLines } from "@/lib/money";
import { getPartner, origin } from "@/lib/queries";

export default async function PartnerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const messages = await searchParams;
  const partner = await getPartner(id);
  if (!partner) notFound();
  const link = `${await origin()}/p/${partner.code}`;
  const totals = commissionTotals(partner.commissionRate, partner.requirements);

  return (
    <>
      <PageTitle kicker="Partner" title={partner.name} text="Share this link when the lead comes from this partner. Each requirement still gets its own link to send." />
      <Banner error={messages.error} notice={messages.notice} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SampleNote sample={partner.sample} />
        <Badge>{partner.commissionRate == null ? "Rate not set" : `${Number(partner.commissionRate)}%`}</Badge>
        <DeleteButton action={deletePartner} id={partner.id} confirmText={`Delete partner ${partner.name}? Their requirements stay.`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-6">
          <Card>
            <h2 className="text-lg font-semibold">Partner link</h2>
            <div className="mt-4">
              <CopyLink url={link} label="Partner link" />
            </div>
          </Card>
          <Card>
            <form action={updatePartner} className="grid gap-4">
              <input type="hidden" name="id" value={partner.id} />
              <Field label="Name">
                <Input name="name" defaultValue={partner.name} required />
              </Field>
              <Field label="Commission rate (%)">
                <Input
                  name="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={partner.commissionRate == null ? "" : Number(partner.commissionRate).toString()}
                  placeholder="Leave blank if unset"
                />
              </Field>
              <Button type="submit">Save partner</Button>
            </form>
            <p className="mt-4 text-sm text-muted">
              {totals
                ? totals.length
                  ? `Commission from paid invoices: ${totals.map(([currency, amount]) => money(amount, currency)).join(", ")}`
                  : "No paid invoices yet."
                : "Commission appears here after you set a rate and a linked invoice is paid."}
            </p>
          </Card>
        </div>
        <Card>
          <h2 className="text-lg font-semibold">Requirements</h2>
          <ul className="mt-4 grid gap-4">
            {partner.requirements.length === 0 ? <li className="text-sm text-muted">No requirements from this partner yet.</li> : null}
            {partner.requirements.map((requirement) => {
              const invoice = requirement.quotation?.contract?.invoice;
              const total = invoice ? sumLines(invoice.lines) : 0;
              const commission =
                invoice?.status === "PAID" && partner.commissionRate != null
                  ? Math.round(total * Number(partner.commissionRate)) / 100
                  : null;
              return (
                <li key={requirement.id} className="border-t border-border pt-4">
                  <Link href={`/requirements/${requirement.id}`} className="font-semibold hover:text-accent">
                    {requirement.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {requirement.clientName}
                    {invoice ? ` · ${invoice.status === "PAID" ? "Paid" : invoice.status === "ISSUED" ? "Issued" : "Invoice draft"} ${money(total, invoice.currency)}` : " · No invoice yet"}
                    {commission != null && invoice ? ` · Commission ${money(commission, invoice.currency)}` : ""}
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
