import Link from "next/link";
import { PageTitle, StatusBadge } from "@/components/desk/DeskShell";
import { money, shanghaiDate, sumLines } from "@/lib/money";
import { listQuotations } from "@/lib/queries";

const statusLabel = { DRAFT: "Draft", ACCEPTED: "Accepted", DECLINED: "Declined" } as const;

export default async function QuotationsPage() {
  const quotations = await listQuotations();

  return (
    <>
      <PageTitle kicker="Quotations" title="Quotations" text="A quotation is the price offer. The PDF uses the same Magpie header and company footer as the other papers." />
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">All quotations</h2>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-y border-gray-100">
              <tr>
                {["Quotation", "Client", "Project", "Total", "Stage", "Updated", "Action"].map((label) => (
                  <th key={label} className="py-3 text-start text-xs font-medium text-gray-500">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-sm text-gray-500">
                    No quotations yet.
                  </td>
                </tr>
              ) : (
                quotations.map((quotation) => (
                  <tr key={quotation.id}>
                    <td className="py-3">
                      <Link href={`/quotations/${quotation.id}`} className="text-sm font-medium text-gray-800 hover:text-brand-500">
                        {quotation.number}
                      </Link>
                      {quotation.requirement.sample ? <p className="text-xs text-gray-500">Sample</p> : null}
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      <p>{quotation.requirement.clientName}</p>
                      {quotation.requirement.clientCompany ? <p className="text-xs text-gray-400">{quotation.requirement.clientCompany}</p> : null}
                    </td>
                    <td className="py-3 text-sm text-gray-500">{quotation.requirement.title}</td>
                    <td className="py-3 text-sm text-gray-800">{money(sumLines(quotation.lines), quotation.currency)}</td>
                    <td className="py-3">
                      <StatusBadge label={statusLabel[quotation.status]} />
                    </td>
                    <td className="py-3 text-sm text-gray-500">{shanghaiDate(quotation.updatedAt)}</td>
                    <td className="py-3 text-sm font-medium">
                      <Link href={`/quotations/${quotation.id}`} className="text-brand-500 hover:text-brand-600">
                        View
                      </Link>
                      <Link href={`/quotations/${quotation.id}/pdf`} className="ml-4 text-brand-500 hover:text-brand-600">
                        PDF
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
