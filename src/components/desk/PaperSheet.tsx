export function PaperSheet({
  title,
  number,
  date,
  companyName,
  nameEn,
  address,
  phone,
  email,
  clientCompany,
  clientName,
  project,
  children,
}: {
  title: string;
  number: string;
  date: string;
  companyName: string;
  nameEn: string;
  address: string;
  phone: string;
  email: string;
  clientCompany: string;
  clientName: string;
  project: string;
  children: React.ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e5dfd4] bg-white shadow-[0_22px_50px_rgba(15,15,15,0.06)]">
      <header className="flex flex-wrap items-center justify-between gap-8 bg-[#f6f2ea] px-6 py-8 sm:px-12 sm:py-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/magpie-logo-purple.png" alt="Magpie Studio" className="h-24 w-auto sm:h-32 lg:h-40" />
        <div className="text-left sm:text-right">
          <p className="text-[11px] font-semibold tracking-[0.32em] text-[#5c2d91]">MAGPIE STUDIO</p>
          <h1
            className="mt-1 text-4xl leading-none text-[#4a2476] sm:text-5xl"
            style={{ fontFamily: "var(--font-hero-title), sans-serif", letterSpacing: "0.06em" }}
          >
            {title}
          </h1>
          <p className="mt-4 text-lg font-semibold text-[#0f0f0f]">{number}</p>
          <p className="text-sm text-[#6b6560]">{date}</p>
        </div>
      </header>
      <div className="h-1.5 bg-[#5c2d91]" />
      <div className="grid gap-8 px-6 py-8 sm:px-12 md:grid-cols-2">
        <section>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#6b6560]">FROM</p>
          <p className="legal-zh mt-3 text-lg font-semibold text-[#0f0f0f]">{companyName}</p>
          <p className="mt-1 text-sm font-medium text-[#4a2476]">{nameEn}</p>
          <dl className="mt-4 space-y-1.5 text-sm text-[#3d3935]">
            <div className="legal-zh">{address}</div>
            <div>
              <span className="text-[#6b6560]">Phone </span>
              {phone}
            </div>
            <div>{email}</div>
          </dl>
        </section>
        <section>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#6b6560]">BILL TO</p>
          <p className="mt-3 text-lg font-semibold text-[#0f0f0f]">{clientCompany || clientName || "Client"}</p>
          {clientCompany && clientName ? <p className="mt-1 text-sm text-[#3d3935]">{clientName}</p> : null}
          {project ? <p className="mt-3 text-sm text-[#4a2476]">{project}</p> : null}
        </section>
      </div>
      <div className="px-6 pb-8 sm:px-12">{children}</div>
    </article>
  );
}
