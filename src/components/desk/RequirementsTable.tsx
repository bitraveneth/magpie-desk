import Link from "next/link";
import { StatusBadge } from "@/components/desk/DeskShell";
import { deskStatus } from "@/lib/brief";
import { shanghaiDate } from "@/lib/money";

type Row = {
  id: string;
  title: string;
  number: string;
  clientName: string;
  clientCompany: string;
  sample: boolean;
  updatedAt: Date;
  briefStatus: string;
  confirmedAt: Date | null;
};

export function RequirementsTable({ jobs, empty }: { jobs: Row[]; empty?: string }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead className="border-y border-gray-100">
          <tr>
            {["Project", "Client", "Stage", "Updated", "Action"].map((label) => (
              <th key={label} className="py-3 text-start text-xs font-medium text-gray-500">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-sm text-gray-500">
                {empty ?? "No requirements yet."}
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id}>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gray-100 text-sm font-semibold text-gray-700">
                      {job.title.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <Link href={`/requirements/${job.id}`} className="text-sm font-medium text-gray-800 hover:text-brand-500">
                        {job.title}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {job.number}
                        {job.sample ? " · Sample" : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-sm text-gray-500">
                  <p>{job.clientName}</p>
                  {job.clientCompany ? <p className="text-xs text-gray-400">{job.clientCompany}</p> : null}
                </td>
                <td className="py-3">
                  <StatusBadge label={deskStatus(job)} />
                </td>
                <td className="py-3 text-sm text-gray-500">{shanghaiDate(job.updatedAt)}</td>
                <td className="py-3 text-sm font-medium">
                  <Link href={`/requirements/${job.id}`} className="text-brand-500 hover:text-brand-600">
                    View
                  </Link>
                  <Link href={`/requirements/${job.id}/pdf`} className="ml-4 text-brand-500 hover:text-brand-600">
                    PDF
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
