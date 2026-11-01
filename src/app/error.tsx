"use client";

export default function DeskError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f6f2ea] px-6">
      <div className="max-w-md text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/magpie-logo-purple.png" alt="Magpie" className="mx-auto h-16 w-auto" />
        <h1 className="mt-6 text-2xl font-semibold text-gray-800">The desk could not open the database.</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          In Vercel, open Settings, then Environment Variables. Add DATABASE_URL for Production, then redeploy.
        </p>
        <button type="button" onClick={() => reset()} className="mt-6 rounded-lg bg-[#5c2d91] px-4 py-2.5 text-sm font-medium text-white">
          Try again
        </button>
      </div>
    </div>
  );
}
