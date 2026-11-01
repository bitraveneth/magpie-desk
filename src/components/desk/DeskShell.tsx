import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DeskFrame } from "@/components/desk/DeskFrame";
import { listNotices } from "@/lib/notices";
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
  return <DeskFrame notices={notices.length}>{children}</DeskFrame>;
}

export function PageTitle({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mb-6 max-w-3xl">
      <Badge>{kicker}</Badge>
      <h1 className="display mt-3 text-4xl text-foreground sm:text-5xl">{title}</h1>
      {text ? <p className="mt-3 text-base leading-7 text-muted">{text}</p> : null}
    </div>
  );
}

export function Banner({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;
  return (
    <p
      className={
        error
          ? "mb-4 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-strong"
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

export function SampleNote({ sample }: { sample: boolean }) {
  if (!sample) return null;
  return <Badge className="border-accent/30 text-accent">Sample data</Badge>;
}

export function StatusBadge({ label }: { label: string }) {
  const tone =
    label === "Filled"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : label === "Signed"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : label === "Confirmed"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-[#e6e8ef] bg-white text-muted";
  return <Badge className={tone}>{label}</Badge>;
}
