import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Banner, StatusBadge } from "@/components/desk/DeskShell";
import { Chain } from "@/components/desk/Chain";
import { InvoiceEditor } from "@/components/desk/InvoiceEditor";
import { company } from "@/content/company";
import { issueInvoice, markInvoicePaid, saveInvoice, setPaymentMethod } from "@/lib/mutations";
import { shanghaiDay } from "@/lib/money";
import { getInvoiceRecord, getPayments, invoiceParties } from "@/lib/queries";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const messages = await searchParams;
  const invoice = await getInvoiceRecord(id);
  if (!invoice) notFound();
  const payments = await getPayments();
  const party = invoiceParties(invoice);
  const job = invoice.contract?.quotation.requirement;
  const paid = invoice.status === "PAID";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={invoice.status === "PAID" ? "Paid" : invoice.status === "ISSUED" ? "Issued" : "Draft"} />
          <Button href={`/invoices/${invoice.id}/pdf`} variant="outline" className="px-4 py-2">
            Download PDF
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/invoices/new" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            New invoice
          </Link>
          {invoice.status === "DRAFT" ? (
            <form action={issueInvoice}>
              <input type="hidden" name="id" value={invoice.id} />
              <Button type="submit">Issue invoice</Button>
            </form>
          ) : null}
          {invoice.status === "ISSUED" ? (
            <form action={markInvoicePaid}>
              <input type="hidden" name="id" value={invoice.id} />
              <Button type="submit">Mark paid</Button>
            </form>
          ) : null}
        </div>
      </div>
      <Banner error={messages.error} notice={messages.notice} />
      {job && invoice.contract?.quotation ? (
        <Chain
          current="invoice"
          requirementId={job.id}
          quotationId={invoice.contract.quotation.id}
          contractId={invoice.contract.id}
          invoiceId={invoice.id}
        />
      ) : null}
      <InvoiceEditor
        action={paid ? undefined : saveInvoice}
        locked={paid}
        invoiceId={invoice.id}
        number={invoice.number}
        date={shanghaiDay(invoice.issuedAt ?? invoice.createdAt)}
        currency={invoice.currency}
        nameEn={company.nameEn}
        purpose={invoice.purpose}
        title={party.title}
        clientName={party.clientName}
        clientCompany={party.clientCompany}
        lines={invoice.lines.map((line) => ({
          key: line.id,
          description: line.description,
          quantity: Number(line.quantity).toString(),
          unitAmount: Number(line.unitAmount).toString(),
          discountRate: Number(line.discountRate).toString(),
        }))}
        seller={{
          companyName: payments.companyName,
          taxNumber: payments.taxNumber,
          address: payments.address,
          phone: payments.phone,
          email: company.email,
          bankName: payments.bankName,
          accountName: payments.accountName,
          accountNumber: payments.accountNumber,
        }}
        showQr={invoice.paymentMethod === "COMPANY_QR" && Boolean(payments.qrImage)}
      />
      {paid ? null : (
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={setPaymentMethod}>
            <input type="hidden" name="id" value={invoice.id} />
            <input type="hidden" name="paymentMethod" value="COMPANY_QR" />
            <Button type="submit" variant={invoice.paymentMethod === "COMPANY_QR" ? "primary" : "outline"}>
              Show company QR
            </Button>
          </form>
          <form action={setPaymentMethod}>
            <input type="hidden" name="id" value={invoice.id} />
            <input type="hidden" name="paymentMethod" value="BANK_SLIP" />
            <Button type="submit" variant={invoice.paymentMethod === "BANK_SLIP" ? "primary" : "outline"}>
              Hide company QR
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
