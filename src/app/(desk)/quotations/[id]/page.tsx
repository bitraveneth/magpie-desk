import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Banner, StatusBadge } from "@/components/desk/DeskShell";
import { Chain } from "@/components/desk/Chain";
import { LineEditor } from "@/components/desk/LineEditor";
import { PaperSheet } from "@/components/desk/PaperSheet";
import { company, quoteTemplates } from "@/content/company";
import { companyPrefix, shanghaiStamp } from "@/lib/contract-number";
import { applyQuoteTemplate, createContract, deleteQuotation, setQuotationStatus, saveQuotation } from "@/lib/mutations";
import { PaperActions } from "@/components/desk/RowActions";
import { money, shanghaiDay } from "@/lib/money";
import { contractCompanyName, getPayments, getQuotationPage } from "@/lib/queries";

export default async function QuotationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const messages = await searchParams;
  const quotation = await getQuotationPage(id);
  const job = quotation?.requirement;
  if (!quotation || !job || quotation.id !== id) notFound();
  const payments = await getPayments();
  const stamp = shanghaiStamp(new Date());
  const preview = `${companyPrefix(contractCompanyName(job.clientCompany, company.publicName))}-${stamp.year}-${stamp.date}-XXXX`;
  const locked = quotation.status !== "DRAFT";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={quotation.status === "ACCEPTED" ? "Accepted" : quotation.status === "DECLINED" ? "Declined" : "Draft"} />
          <PaperActions
            pdfHref={`/quotations/${quotation.id}/pdf`}
            action={deleteQuotation}
            id={quotation.id}
            confirmText={`Delete quotation ${quotation.number}? The invoice stays.`}
          />
        </div>
        <Link href="/quotations/new" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          New quotation
        </Link>
      </div>
      <Banner error={messages.error} notice={messages.notice} />
      <Chain
        current="quotation"
        requirementId={job.id}
        quotationId={quotation.id}
        contractId={quotation.contract?.id}
        invoiceId={quotation.contract?.invoice?.id}
      />
      {locked ? null : (
        <div className="mb-4 flex flex-wrap gap-2">
          {quoteTemplates.map((template) => (
            <form key={template.id} action={applyQuoteTemplate}>
              <input type="hidden" name="id" value={quotation.id} />
              <input type="hidden" name="templateId" value={template.id} />
              <Button type="submit" variant="outline" className="px-3 py-2">
                {template.name} · {money(template.amount, "USD")}
              </Button>
            </form>
          ))}
        </div>
      )}
      <PaperSheet
        title="QUOTATION"
        number={quotation.number}
        date={shanghaiDay(quotation.createdAt)}
        companyName={payments.companyName}
        nameEn={company.nameEn}
        address={payments.address}
        phone={payments.phone}
        email={company.email}
        clientCompany={job.clientCompany}
        clientName={job.clientName}
        project={job.title}
      >
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
      </PaperSheet>
      <div className="mt-4 flex flex-wrap gap-3">
        {quotation.status === "DRAFT" ? (
          <>
            <form action={setQuotationStatus}>
              <input type="hidden" name="id" value={quotation.id} />
              <input type="hidden" name="status" value="ACCEPTED" />
              <Button type="submit">Accept quotation</Button>
            </form>
            <form action={setQuotationStatus}>
              <input type="hidden" name="id" value={quotation.id} />
              <input type="hidden" name="status" value="DECLINED" />
              <Button type="submit" variant="outline">
                Decline
              </Button>
            </form>
          </>
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
            <input type="hidden" name="quotationId" value={quotation.id} />
            <Button type="submit">Create contract · {preview}</Button>
          </form>
        ) : null}
        {quotation.contract ? <Button href={`/contracts/${quotation.contract.id}`}>Open {quotation.contract.number}</Button> : null}
      </div>
    </>
  );
}
