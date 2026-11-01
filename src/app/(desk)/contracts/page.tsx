import Link from "next/link";
import { DeleteButton } from "@/components/desk/DeleteButton";
import { PageTitle, StatusBadge } from "@/components/desk/DeskShell";
import { deleteContract } from "@/lib/mutations";
import { listRequirements } from "@/lib/queries";
import { shanghaiDate } from "@/lib/money";

export default async function ContractsPage() {
  const jobs = (await listRequirements()).filter((job) => job.quotation?.contract);

  return (
    <>
      <PageTitle kicker="Contracts" title="Contracts" text="A contract opens after the quotation is accepted." />
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">All contracts</h2>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-y border-gray-100">
              <tr>
                {["Contract", "Client", "Project", "Stage", "Updated", "Action"].map((label) => (
                  <th key={label} className="py-3 text-start text-xs font-medium text-gray-500">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-sm text-gray-500">
                    No contracts yet.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const contract = job.quotation!.contract!;
                  return (
                    <tr key={contract.id}>
                      <td className="py-3">
                        <Link href={`/contracts/${contract.id}`} className="text-sm font-medium text-gray-800 hover:text-brand-500">
                          {contract.number}
                        </Link>
                        {job.sample ? <p className="text-xs text-gray-500">Sample</p> : null}
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        <p>{job.clientName}</p>
                        {job.clientCompany ? <p className="text-xs text-gray-400">{job.clientCompany}</p> : null}
                      </td>
                      <td className="py-3 text-sm text-gray-500">{job.title}</td>
                      <td className="py-3">
                        <StatusBadge label={contract.status === "SIGNED" ? "Signed" : "Draft"} />
                      </td>
                      <td className="py-3 text-sm text-gray-500">{shanghaiDate(contract.updatedAt)}</td>
                      <td className="py-3 text-sm font-medium">
                        <Link href={`/contracts/${contract.id}`} className="text-brand-500 hover:text-brand-600">
                          View
                        </Link>
                        <Link href={`/contracts/${contract.id}/pdf`} className="ml-4 text-brand-500 hover:text-brand-600">
                          PDF
                        </Link>
                        <span className="ml-4">
                          <DeleteButton action={deleteContract} id={contract.id} confirmText={`Delete contract ${contract.number}? The invoice stays.`} />
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
