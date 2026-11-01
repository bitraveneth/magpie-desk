import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { company } from "@/content/company";
import "./globals.css";

const urbanist = localFont({
  src: "../fonts/urbanist-latin.woff2",
  variable: "--font-urbanist",
  weight: "100 900",
  display: "swap",
});

const fugazOne = localFont({
  src: "../fonts/fugaz-one.woff2",
  variable: "--font-hero-title",
  weight: "400",
  display: "swap",
});

const notoSansSc = localFont({
  src: "../fonts/noto-sans-sc.woff2",
  variable: "--font-noto-sc",
  weight: "500",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Magpie Desk",
  description: `Requirements, quotations, contracts, and invoices for ${company.publicName}.`,
  icons: { icon: "/brand/magpie-mark.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f6f2ea",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${urbanist.variable} ${fugazOne.variable} ${notoSansSc.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
