import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Banner, PageTitle } from "@/components/desk/DeskShell";
import { Chain } from "@/components/desk/Chain";
import { company } from "@/content/company";
import { issueInvoice, markInvoicePaid, setPaymentMethod } from "@/lib/mutations";
import { money, shanghaiDate, sumLines } from "@/lib/money";
import { getJobByInvoice, getPayments } from "@/lib/queries";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const messages = await searchParams;
  const job = await getJobByInvoice(id);
  const invoice = job?.quotation?.contract?.invoice;
  if (!job || !job.quotation || !job.quotation.contract || !invoice || invoice.id !== id) notFound();
  const payments = await getPayments();
  const total = sumLines(invoice.lines);
  const paid = invoice.status === "PAID";

  return (
    <>
      <PageTitle kicker={invoice.number} title="Invoice" text={`${job.clientName} · ${job.title}`} />
      <Banner error={messages.error} notice={messages.notice} />
      <Chain
        current="invoice"
        requirementId={job.id}
        quotationId={job.quotation.id}
        contractId={job.quotation.contract.id}
        invoiceId={invoice.id}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge>{invoice.status === "PAID" ? "Paid" : invoice.status === "ISSUED" ? "Issued" : "Draft"}</Badge>
        {invoice.issuedAt ? <Badge>Issued {shanghaiDate(invoice.issuedAt)}</Badge> : null}
        {invoice.paidAt ? <Badge>Paid {shanghaiDate(invoice.paidAt)}</Badge> : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <p className="legal-zh text-sm text-muted">{company.nameZh}</p>
          <p className="mt-1 text-sm text-muted">{company.nameEn}</p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">Description</th>
                  <th className="py-2 pr-3 font-medium">Qty</th>
                  <th className="py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id} className="border-t border-border">
                    <td className="py-3 pr-3">{line.description}</td>
                    <td className="py-3 pr-3">{Number(line.quantity)}</td>
                    <td className="py-3">{money(Number(line.quantity) * Number(line.unitAmount), invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-lg font-semibold">Total {money(total, invoice.currency)}</p>
        </Card>
        <div className="grid gap-6">
          <Card>
            <h2 className="text-lg font-semibold">Payment instruction</h2>
            <p className="mt-2 text-sm text-muted">Show one: the company QR or the bank slip.</p>
            {paid ? (
              <p className="mt-4 text-sm font-semibold">
                {invoice.paymentMethod === "COMPANY_QR" ? "Company QR" : "Bank slip"}
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={setPaymentMethod}>
                  <input type="hidden" name="id" value={invoice.id} />
                  <input type="hidden" name="paymentMethod" value="COMPANY_QR" />
                  <Button type="submit" variant={invoice.paymentMethod === "COMPANY_QR" ? "primary" : "outline"}>
                    Company QR
                  </Button>
                </form>
                <form action={setPaymentMethod}>
                  <input type="hidden" name="id" value={invoice.id} />
                  <input type="hidden" name="paymentMethod" value="BANK_SLIP" />
                  <Button type="submit" variant={invoice.paymentMethod === "BANK_SLIP" ? "primary" : "outline"}>
                    Bank slip
                  </Button>
                </form>
              </div>
            )}
            <div className="mt-4">
              <PaymentInstruction method={invoice.paymentMethod} payments={payments} />
            </div>
          </Card>
          <Card>
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
            {paid ? <p className="text-sm text-muted">This invoice is paid. Commission uses this total when a partner is attached.</p> : null}
          </Card>
        </div>
      </div>
    </>
  );
}

function PaymentInstruction({
  method,
  payments,
}: {
  method: "COMPANY_QR" | "BANK_SLIP" | null;
  payments: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    qrImage: Uint8Array | null;
    slipImage: Uint8Array | null;
  };
}) {
  if (!method) return <p className="text-sm text-muted">Choose company QR or bank slip.</p>;
  if (method === "COMPANY_QR") {
    if (!payments.qrImage) {
      return (
        <p className="text-sm text-muted">
          No company QR yet. Add one in <a className="font-semibold text-accent" href="/settings/payments">payment settings</a>.
        </p>
      );
    }
    return (
      <Image
        src="/files/qr"
        alt="Company payment QR"
        width={192}
        height={192}
        unoptimized
        className="w-48 rounded-2xl border border-border bg-card"
      />
    );
  }
  const hasText = payments.bankName || payments.accountName || payments.accountNumber;
  if (!hasText && !payments.slipImage) {
    return (
      <p className="text-sm text-muted">
        No bank slip yet. Add the details in <a className="font-semibold text-accent" href="/settings/payments">payment settings</a>.
      </p>
    );
  }
  return (
    <div className="grid gap-3 text-sm">
      {payments.bankName ? <p>Bank: {payments.bankName}</p> : null}
      {payments.accountName ? <p>Account name: {payments.accountName}</p> : null}
      {payments.accountNumber ? <p>Account number: {payments.accountNumber}</p> : null}
      {payments.slipImage ? (
        <Image
          src="/files/slip"
          alt="Bank slip"
          width={480}
          height={320}
          unoptimized
          className="h-auto max-w-full rounded-2xl border border-border bg-card"
        />
      ) : null}
    </div>
  );
}
