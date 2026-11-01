import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DeskFrame } from "@/components/desk/DeskFrame";
import { listNotices } from "@/lib/notices";
import { shanghaiDate } from "@/lib/money";
import { ensureDesk } from "@/lib/queries";

export async function DeskShell({
  children,
  publicMode = false,
}: {
  children: React.ReactNode;
  publicMode?: boolean;
}) {
  if (publicMode) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-border bg-card/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link href="https://magpiestudio.com" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/magpie-logo-purple.png" alt="Magpie Studio" className="h-10 w-auto" />
            </Link>
            <p className="text-sm font-medium text-muted">Magpie Desk</p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    );
  }

  await ensureDesk();
  const notices = await listNotices();
  return (
    <DeskFrame
      notices={notices.map((notice) => ({
        id: notice.id,
        message: notice.message,
        when: shanghaiDate(notice.createdAt),
        requirementId: notice.requirement.id,
        requirementNumber: notice.requirement.number,
      }))}
    >
      {children}
    </DeskFrame>
  );
}

export function PageTitle({
  kicker,
  title,
  text,
  variant = "desk",
}: {
  kicker: string;
  title: string;
  text?: string;
  variant?: "desk" | "public";
}) {
  if (variant === "public") {
    return (
      <div className="mb-6 max-w-3xl">
        <Badge>{kicker}</Badge>
        <h1 className="display mt-3 text-4xl text-foreground sm:text-5xl">{title}</h1>
        {text ? <p className="mt-3 text-base leading-7 text-muted">{text}</p> : null}
      </div>
    );
  }
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        {text ? <p className="mt-1 text-sm text-gray-500">{text}</p> : null}
      </div>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
        <span className="text-gray-500">Home</span>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-gray-400" aria-hidden="true">
          <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-gray-800">{kicker}</span>
      </nav>
    </div>
  );
}

export function Banner({ error, notice, variant = "desk" }: { error?: string; notice?: string; variant?: "desk" | "public" }) {
  if (!error && !notice) return null;
  const desk = variant === "desk";
  return (
    <p
      className={
        error
          ? desk
            ? "mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            : "mb-4 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-strong"
          : desk
            ? "mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-theme-xs"
            : "mb-4 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
      }
    >
      {error ?? notice}
    </p>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

export function SampleNote({ sample, variant = "desk" }: { sample: boolean; variant?: "desk" | "public" }) {
  if (!sample) return null;
  if (variant === "public") return <Badge className="border-accent/30 text-accent">Sample data</Badge>;
  return <Badge className="border-transparent bg-brand-50 text-brand-500">Sample</Badge>;
}

export function StatusBadge({ label }: { label: string }) {
  const tone =
    label === "Filled"
      ? "border-transparent bg-orange-50 text-orange-600"
      : label === "Signed"
        ? "border-transparent bg-brand-50 text-brand-500"
        : label === "Confirmed"
          ? "border-transparent bg-green-50 text-green-600"
          : "border-transparent bg-gray-100 text-gray-600";
  return <Badge className={tone}>{label}</Badge>;
}
