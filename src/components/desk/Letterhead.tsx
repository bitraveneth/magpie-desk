import { company } from "@/content/company";

export function Letterhead({
  documentName,
  number,
  date,
  client,
  project,
}: {
  documentName: string;
  number: string;
  date: string;
  client: string;
  project: string;
}) {
  return (
    <div className="border-b border-border pb-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/magpie-logo-purple.png" alt="Magpie Studio" className="h-12 w-auto" />
        <div className="max-w-sm text-sm sm:text-right">
          <p className="legal-zh text-muted">{company.nameZh}</p>
          <p className="mt-1 font-semibold">{company.nameEn}</p>
          <p className="mt-2 whitespace-pre-line text-muted">{company.address}</p>
          <p className="text-muted">{company.email}</p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Prepared for</p>
          <p className="text-2xl font-semibold">{client || "Client"}</p>
          {project ? <p className="mt-1 text-sm text-muted">{project}</p> : null}
        </div>
        <div className="text-sm sm:text-right">
          <p className="text-lg font-semibold">{documentName}</p>
          <p className="mt-1">{number}</p>
          <p className="text-muted">{date}</p>
        </div>
      </div>
    </div>
  );
}
