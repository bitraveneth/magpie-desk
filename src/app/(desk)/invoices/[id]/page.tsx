import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Banner, Field, PageTitle, StatusBadge } from "@/components/desk/DeskShell";
import { Chain } from "@/components/desk/Chain";
import { Letterhead } from "@/components/desk/Letterhead";
import { LineEditor } from "@/components/desk/LineEditor";
import { issueInvoice, markInvoicePaid, saveInvoice, setPaymentMethod } from "@/lib/mutations";
import { money, shanghaiDate, shanghaiDay, sumLines } from "@/lib/money";
import { getInvoiceRecord, getPayments, invoiceParties, paymentDetailLines } from "@/lib/queries";

const purposeLabel: Record<string, string> = {
  WEB: "Web development",
  PRODUCT: "Product purchase",
  TRADING: "Trading",
};
const purposes = [
  ["WEB", "Web development"],
  ["PRODUCT", "Product purchase"],
  ["TRADING", "Trading"],
] as const;

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
  const total = sumLines(invoice.lines);
  const paid = invoice.status === "PAID";
  const bankLines = paymentDetailLines(payments);
  const client = party.clientCompany || party.clientName;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <PageTitle kicker={purposeLabel[invoice.purpose] ?? "Invoice"} title={invoice.number} text={party.title || "Add what this invoice is for, then add the lines."} />
        <Link href="/invoices/new" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          New invoice
        </Link>
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
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge label={invoice.status === "PAID" ? "Paid" : invoice.status === "ISSUED" ? "Issued" : "Draft"} />
        <Badge>{purposeLabel[invoice.purpose] ?? invoice.purpose}</Badge>
        {invoice.issuedAt ? <Badge>Issued {shanghaiDate(invoice.issuedAt)}</Badge> : null}
        {invoice.paidAt ? <Badge>Paid {shanghaiDate(invoice.paidAt)}</Badge> : null}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <Letterhead
            documentName="Invoice"
            number={invoice.number}
            date={shanghaiDay(invoice.issuedAt ?? invoice.createdAt)}
            client={client || "Client"}
            project={party.title}
          />
          <div className="mt-6">
            {paid ? (
              <InvoiceLines invoice={invoice} total={total} />
            ) : (
              <LineEditor
                action={saveInvoice}
                quotationId={invoice.id}
                currency={invoice.currency}
                locked={false}
                lines={invoice.lines.map((line) => ({
                  key: line.id,
                  description: line.description,
                  quantity: Number(line.quantity).toString(),
                  unitAmount: Number(line.unitAmount).toString(),
                }))}
                submitLabel="Save invoice"
                extra={
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="What is this invoice for?">
                      <select name="purpose" defaultValue={invoice.purpose} className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-theme-xs">
                        {purposes.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Other company">
                      <Input name="clientCompany" defaultValue={party.clientCompany} />
                    </Field>
                    <Field label="Contact name">
                      <Input name="clientName" defaultValue={party.clientName} />
                    </Field>
                    <Field label="What you are billing">
                      <Input name="title" defaultValue={party.title} />
                    </Field>
                  </div>
                }
              />
            )}
          </div>
          {paid ? null : <p className="mt-4 text-right text-lg font-semibold text-gray-800">Saved total {money(total, invoice.currency)}</p>}
          <BankBlock lines={bankLines} payments={payments} method={invoice.paymentMethod} />
          <div className="mt-4">
            <Button href={`/invoices/${invoice.id}/pdf`} variant="outline">
              Download PDF
            </Button>
          </div>
        </Card>
        <div className="grid content-start gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-800">Payment mark</h2>
            <p className="mt-2 text-sm text-gray-500">The bank details are always printed below the lines. Add the company QR only when you want the client to scan it.</p>
            {paid ? (
              <p className="mt-4 text-sm font-semibold text-gray-800">
                {invoice.paymentMethod === "COMPANY_QR" ? "Company QR is on this invoice." : "Bank details only."}
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={setPaymentMethod}>
                  <input type="hidden" name="id" value={invoice.id} />
                  <input type="hidden" name="paymentMethod" value="COMPANY_QR" />
                  <Button type="submit" variant={invoice.paymentMethod === "COMPANY_QR" ? "primary" : "outline"}>
                    Add company QR
                  </Button>
                </form>
                <form action={setPaymentMethod}>
                  <input type="hidden" name="id" value={invoice.id} />
                  <input type="hidden" name="paymentMethod" value="BANK_SLIP" />
                  <Button type="submit" variant={invoice.paymentMethod === "BANK_SLIP" ? "primary" : "outline"}>
                    Bank details only
                  </Button>
                </form>
              </div>
            )}
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
            {paid ? <p className="text-sm text-gray-500">This invoice is paid. Make another one when the next job, purchase, or trade needs a bill.</p> : null}
          </Card>
        </div>
      </div>
    </>
  );
}

function InvoiceLines({
  invoice,
  total,
}: {
  invoice: { currency: string; lines: { id: string; description: string; quantity: { toString(): string }; unitAmount: { toString(): string } }[] };
  total: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-y border-gray-100 text-xs font-medium text-gray-500">
          <tr>
            <th className="py-3">Description</th>
            <th className="py-3">Qty</th>
            <th className="py-3">Unit</th>
            <th className="py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoice.lines.map((line) => (
            <tr key={line.id}>
              <td className="py-3 text-gray-800">{line.description}</td>
              <td className="py-3 text-gray-500">{Number(line.quantity)}</td>
              <td className="py-3 text-gray-500">{money(Number(line.unitAmount), invoice.currency)}</td>
              <td className="py-3 text-right text-gray-800">{money(Number(line.quantity) * Number(line.unitAmount), invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-right text-lg font-semibold text-gray-800">Total {money(total, invoice.currency)}</p>
    </div>
  );
}

function BankBlock({
  lines,
  payments,
  method,
}: {
  lines: string[];
  method: "COMPANY_QR" | "BANK_SLIP" | null;
  payments: { qrImage: Uint8Array | null; slipImage: Uint8Array | null };
}) {
  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h2 className="text-sm font-semibold text-gray-800">Pay to</h2>
      <div className="mt-3 grid gap-1 text-sm text-gray-700">
        {lines.map((line) => (
          <p key={line} className="legal-zh">
            {line}
          </p>
        ))}
      </div>
      {method === "COMPANY_QR" && payments.qrImage ? (
        <Image src="/files/qr" alt="Company payment QR" width={160} height={160} unoptimized className="mt-4 w-40 rounded-xl border border-gray-200 bg-white" />
      ) : null}
      {method === "BANK_SLIP" && payments.slipImage ? (
        <Image src="/files/slip" alt="Bank slip" width={360} height={220} unoptimized className="mt-4 h-auto max-w-sm rounded-xl border border-gray-200 bg-white" />
      ) : null}
    </div>
  );
}
