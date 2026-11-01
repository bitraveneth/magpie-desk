"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth-actions";

const links = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/requirements", label: "Requirements", icon: "file" },
  { href: "/requirements/questions", label: "Questions", icon: "list" },
  { href: "/partners", label: "Partners", icon: "users" },
  { href: "/settings/payments", label: "Payments", icon: "card" },
];

function active(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (href === "/requirements") {
    return pathname === "/requirements" || (pathname.startsWith("/requirements/") && !pathname.startsWith("/requirements/questions"));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Icon({ name }: { name: string }) {
  const common = "h-5 w-5";
  if (name === "grid") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (name === "file") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
        <path d="M14 3.5V9h5.5" />
      </svg>
    );
  }
  if (name === "list") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 7h11M9 12h11M9 17h11" />
        <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <circle cx="17" cy="9" r="2.2" />
        <path d="M16.2 19a4.4 4.4 0 0 1 4.3-3.2" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function DeskFrame({ children, notices = 0 }: { children: React.ReactNode; notices?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-foreground">
      {open ? <button type="button" className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[#e6e8ef] bg-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Link href="/" className="flex h-16 items-center gap-3 border-b border-[#e6e8ef] px-5" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/magpie-logo-purple.png" alt="Magpie Studio" className="h-8 w-auto" />
        </Link>
        <nav className="flex-1 space-y-1 px-4 py-5">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Menu</p>
          {links.map((link) => {
            const on = active(link.href, pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${on ? "bg-accent/10 text-accent" : "text-foreground hover:bg-[#f4f6fb]"}`}
              >
                <Icon name={link.icon} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e6e8ef] bg-white/95 px-4 backdrop-blur sm:px-6">
          <button type="button" className="rounded-lg p-2 text-foreground lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-muted">Magpie Desk</p>
          <div className="flex items-center gap-3">
            <Link href="/" className="relative rounded-full border border-[#e6e8ef] px-3 py-1.5 text-xs font-semibold text-foreground">
              Notices
              {notices > 0 ? <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-white">{notices}</span> : null}
            </Link>
            <form action={logout}>
              <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:text-accent">
                Log out
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
