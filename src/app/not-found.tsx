import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f6f2ea] px-6">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/magpie-logo-purple.png" alt="Magpie" className="mx-auto h-16 w-auto" />
        <h1 className="mt-6 text-2xl font-semibold text-gray-800">That page is not here.</h1>
        <Link href="/" className="mt-6 inline-flex rounded-lg bg-[#5c2d91] px-4 py-2.5 text-sm font-medium text-white">
          Back to the desk
        </Link>
      </div>
    </div>
  );
}
