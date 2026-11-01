import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Banner, PageTitle } from "@/components/desk/DeskShell";
import { Chain } from "@/components/desk/Chain";
import { LineEditor } from "@/components/desk/LineEditor";
import { companyPrefix, shanghaiStamp } from "@/lib/contract-number";
import { createContract, setQuotationStatus, saveQuotation } from "@/lib/mutations";
import { money, sumLines } from "@/lib/money";
import { contractCompanyName, getCompany, getJobByQuotation } from "@/lib/queries";

export default async function QuotationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const messages = await searchParams;
  const job = await getJobByQuotation(id);
  const quotation = job?.quotation;
  if (!job || !quotation || quotation.id !== id) notFound();
  const profile = await getCompany();
  const stamp = shanghaiStamp(new Date());
  const preview = `${companyPrefix(contractCompanyName(job.clientCompany, profile.publicName))}-${stamp.year}-${stamp.date}-XXXX`;
  const total = sumLines(quotation.lines);
  const locked = quotation.status !== "DRAFT";

  return (
    <>
      <PageTitle kicker={quotation.number} title="Quotation" text={`${job.clientName} · ${job.title}`} />
      <Banner error={messages.error} notice={messages.notice} />
      <Chain
        current="quotation"
        requirementId={job.id}
        quotationId={quotation.id}
        contractId={quotation.contract?.id}
        invoiceId={quotation.contract?.invoice?.id}
      />
      <div className="mb-4">
        <Badge>
          {quotation.status === "ACCEPTED" ? "Accepted" : quotation.status === "DECLINED" ? "Declined" : "Draft"}
        </Badge>
      </div>
      <Card>
        <LineEditor
          action={saveQuotation}
          quotationId={quotation.id}
          currency={quotation.currency}
          locked={locked}
          lines={quotation.lines.map((line) => ({
            key: line.id,
            description: line.description,
            quantity: Number(line.quantity).toString(),
            unitAmount: Number(line.unitAmount).toString(),
          }))}
        />
        <p className="mt-6 text-lg font-semibold">Total {money(total, quotation.currency)}</p>
      </Card>
      <Card className="mt-6">
        {quotation.status === "DRAFT" ? (
          <div className="flex flex-wrap gap-3">
            <form action={setQuotationStatus}>
              <input type="hidden" name="id" value={quotation.id} />
              <input type="hidden" name="status" value="ACCEPTED" />
              <Button type="submit">Accept quotation</Button>
            </form>
            <form action={setQuotationStatus}>
              <input type="hidden" name="id" value={quotation.id} />
              <input type="hidden" name="status" value="DECLINED" />
              <Button type="submit" variant="ghost">
                Decline
              </Button>
            </form>
          </div>
        ) : null}
        {quotation.status === "DECLINED" ? (
          <form action={setQuotationStatus}>
            <input type="hidden" name="id" value={quotation.id} />
            <input type="hidden" name="status" value="DRAFT" />
            <Button type="submit" variant="outline">
              Reopen quotation
            </Button>
          </form>
        ) : null}
        {quotation.status === "ACCEPTED" && !quotation.contract ? (
          <form action={createContract}>
            <p className="mb-4 text-sm text-muted">
              The contract number uses the first two words of the client company, then the year, the date, and a unique code. It will look like {preview}.
            </p>
            <input type="hidden" name="quotationId" value={quotation.id} />
            <Button type="submit">Create contract</Button>
          </form>
        ) : null}
        {quotation.contract ? (
          <Button href={`/contracts/${quotation.contract.id}`}>Open {quotation.contract.number}</Button>
        ) : null}
      </Card>
    </>
  );
}
