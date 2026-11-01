import Link from "next/link";
import { PageTitle, StatusBadge } from "@/components/desk/DeskShell";
import { money, shanghaiDate, sumLines } from "@/lib/money";
import { listRequirements } from "@/lib/queries";

const invoiceLabel = { DRAFT: "Draft", ISSUED: "Issued", PAID: "Paid" } as const;

export default async function InvoicesPage() {
  const jobs = (await listRequirements()).filter((job) => job.quotation?.contract?.invoice);

  return (
    <>
      <PageTitle kicker="Invoices" title="Invoices" text="An invoice opens after the contract is signed. It shows either the company QR or the bank slip." />
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">All invoices</h2>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-y border-gray-100">
              <tr>
                {["Invoice", "Client", "Project", "Total", "Stage", "Updated", "Action"].map((label) => (
                  <th key={label} className="py-3 text-start text-xs font-medium text-gray-500">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-sm text-gray-500">
                    No invoices yet.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const invoice = job.quotation!.contract!.invoice!;
                  const stage = invoiceLabel[invoice.status];
                  return (
                    <tr key={invoice.id}>
                      <td className="py-3">
                        <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-gray-800 hover:text-brand-500">
                          {invoice.number}
                        </Link>
                        {job.sample ? <p className="text-xs text-gray-500">Sample</p> : null}
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        <p>{job.clientName}</p>
                        {job.clientCompany ? <p className="text-xs text-gray-400">{job.clientCompany}</p> : null}
                      </td>
                      <td className="py-3 text-sm text-gray-500">{job.title}</td>
                      <td className="py-3 text-sm text-gray-800">{money(sumLines(invoice.lines), invoice.currency)}</td>
                      <td className="py-3">
                        <StatusBadge label={stage} />
                      </td>
                      <td className="py-3 text-sm text-gray-500">{shanghaiDate(invoice.updatedAt)}</td>
                      <td className="py-3 text-sm font-medium">
                        <Link href={`/invoices/${invoice.id}`} className="text-brand-500 hover:text-brand-600">
                          View
                        </Link>
                        <Link href={`/invoices/${invoice.id}/pdf`} className="ml-4 text-brand-500 hover:text-brand-600">
                          PDF
                        </Link>
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
