export default function BriefLoading() {
  return (
    <div className="brief-stage flex min-h-dvh flex-col">
      <div className="brief-frame">
        <header className="mb-5 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/magpie-logo-purple.png" alt="Magpie Studio" className="h-9 w-auto" />
        </header>
        <div className="brief-sheet text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Magpie Studio</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight">Opening your brief</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">The questions are on the way. This page opens once, then each step stays on your device.</p>
        </div>
      </div>
    </div>
  );
}
