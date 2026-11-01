import Link from "next/link";
import { DeleteButton } from "@/components/desk/DeleteButton";
import { PageTitle, StatusBadge } from "@/components/desk/DeskShell";
import { deleteInvoice } from "@/lib/mutations";
import { money, shanghaiDate, sumLines } from "@/lib/money";
import { invoiceParties, listInvoices } from "@/lib/queries";

const invoiceLabel = { DRAFT: "Draft", ISSUED: "Issued", PAID: "Paid" } as const;
const purposes = [
  ["", "All"],
  ["WEB", "Web development"],
  ["PRODUCT", "Product purchase"],
  ["TRADING", "Trading"],
] as const;
const purposeLabel: Record<string, string> = {
  WEB: "Web development",
  PRODUCT: "Product purchase",
  TRADING: "Trading",
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ purpose?: string }>;
}) {
  const messages = await searchParams;
  const selected = purposes.some(([value]) => value === messages.purpose) ? messages.purpose ?? "" : "";
  const invoices = (await listInvoices()).filter((invoice) => !selected || invoice.purpose === selected);

  return (
    <>
      <PageTitle kicker="Invoices" title="Invoices" text="Create as many as you need. Each sheet has line discounts, a savings total, and your company bank details." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {purposes.map(([value, label]) => {
            const on = selected === value;
            const href = value ? `/invoices?purpose=${value}` : "/invoices";
            return (
              <Link
                key={label}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${on ? "bg-brand-50 text-brand-500" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <Link href="/invoices/new" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          New invoice
        </Link>
      </div>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">{selected ? purposeLabel[selected] : "All invoices"}</h2>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="border-y border-gray-100">
              <tr>
                {["Invoice", "Purpose", "Client", "What", "Total", "Stage", "Updated", "Action"].map((label) => (
                  <th key={label} className="py-3 text-start text-xs font-medium text-gray-500">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-sm text-gray-500">
                    No invoices in this list yet.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const party = invoiceParties(invoice);
                  return (
                    <tr key={invoice.id}>
                      <td className="py-3">
                        <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-gray-800 hover:text-brand-500">
                          {invoice.number}
                        </Link>
                      </td>
                      <td className="py-3 text-sm text-gray-700">{purposeLabel[invoice.purpose] ?? invoice.purpose}</td>
                      <td className="py-3 text-sm text-gray-500">
                        <p>{party.clientCompany || party.clientName || "—"}</p>
                        {party.clientCompany && party.clientName ? <p className="text-xs text-gray-400">{party.clientName}</p> : null}
                      </td>
                      <td className="py-3 text-sm text-gray-500">{party.title}</td>
                      <td className="py-3 text-sm text-gray-800">{money(sumLines(invoice.lines), invoice.currency)}</td>
                      <td className="py-3">
                        <StatusBadge label={invoiceLabel[invoice.status]} />
                      </td>
                      <td className="py-3 text-sm text-gray-500">{shanghaiDate(invoice.updatedAt)}</td>
                      <td className="py-3 text-sm font-medium">
                        <Link href={`/invoices/${invoice.id}`} className="text-brand-500 hover:text-brand-600">
                          View
                        </Link>
                        <Link href={`/invoices/${invoice.id}/pdf`} className="ml-4 text-brand-500 hover:text-brand-600">
                          PDF
                        </Link>
                        <span className="ml-4">
                          <DeleteButton action={deleteInvoice} id={invoice.id} confirmText={`Delete invoice ${invoice.number}?`} />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
