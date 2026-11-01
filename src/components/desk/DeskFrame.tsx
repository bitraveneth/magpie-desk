"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth-actions";

export type DeskNoticeItem = {
  id: string;
  message: string;
  when: string;
  requirementId: string;
  requirementNumber: string;
};

const links = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/requirements", label: "Requirements", icon: "file" },
  { href: "/contracts", label: "Contracts", icon: "contract" },
  { href: "/invoices", label: "Invoices", icon: "invoice" },
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
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" } as const;
  if (name === "grid") {
    return (
      <svg {...common}>
        <path fillRule="evenodd" clipRule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "file") {
    return (
      <svg {...common}>
        <path fillRule="evenodd" clipRule="evenodd" d="M8.504 4.25a.75.75 0 01.75-.75h6.024a.75.75 0 01.53.22l2.473 2.472c.14.141.22.332.22.53V16.75a.75.75 0 01-.75.75H9.253a.75.75 0 01-.75-.75V4.25zM14.748 19H9.254a2.25 2.25 0 01-2.25-2.25V6.499h-.756a.75.75 0 00-.75.75V19.75c0 .414.336.75.75.75h7.75a.75.75 0 00.75-.75V19zM7.004 4.999V4.25A2.25 2.25 0 019.254 2h6.024c.596 0 1.169.237 1.59.659l2.473 2.473c.422.422.66.994.66 1.59V16.75A2.25 2.25 0 0117.75 19h-1.503v.75a2.25 2.25 0 01-2.25 2.25h-7.75a2.25 2.25 0 01-2.25-2.25V7.249a2.25 2.25 0 012.25-2.25h.756z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "list") {
    return (
      <svg {...common}>
        <path fillRule="evenodd" clipRule="evenodd" d="M5.5 3.25A2.25 2.25 0 003.25 5.5v13a2.25 2.25 0 002.25 2.25h13a2.25 2.25 0 002.25-2.25v-13a2.25 2.25 0 00-2.25-2.25h-13zM4.75 5.5a.75.75 0 01.75-.75h13a.75.75 0 01.75.75v13a.75.75 0 01-.75.75h-13a.75.75 0 01-.75-.75v-13zm1.5 4.214a.75.75 0 01.75-.75h10a.75.75 0 110 1.5H7a.75.75 0 01-.75-.75zm0 4.572a.75.75 0 01.75-.75h10a.75.75 0 110 1.5H7a.75.75 0 01-.75-.75z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg {...common}>
        <path d="M14.109 5.104a2.947 2.947 0 11.001 5.39m1.687 2.727c3.802.224 5.024 2.788 5.416 4.47.186.797-.47 1.458-1.289 1.458H17.59m-5.839-11.35a2.947 2.947 0 11-5.894 0 2.947 2.947 0 015.894 0zM8.75 13.205c4.234 0 5.554 2.726 5.964 4.486.186.797-.47 1.458-1.29 1.458H4.076c-.818 0-1.475-.662-1.29-1.458.411-1.76 1.73-4.486 5.964-4.486z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "contract") {
    return (
      <svg {...common}>
        <path d="M7.5 3.75h6.2l3.05 3.05V20.25a1 1 0 0 1-1 1h-8.25a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13.5 3.75V7h3.25M8.5 12.2 11 14.7 15.7 9.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "invoice") {
    return (
      <svg {...common}>
        <path d="M15.484 7.723a2.613 2.613 0 00-2.613-2.613h-1.057a3.298 3.298 0 00-1.158 6.386l2.688 1.009a3.298 3.298 0 01-1.158 6.386H11.13a2.613 2.613 0 01-2.613-2.613M12 19.283v1.925m0-18.416v1.925" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SearchForm({ className, inputRef }: { className?: string; inputRef?: React.RefObject<HTMLInputElement | null> }) {
  return (
    <form action="/requirements" className={className}>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-500">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M14.382 14.383l3.325 3.326m-1.249-8.334a7.082 7.082 0 01-7.083 7.081 7.082 7.082 0 110-14.163 7.082 7.082 0 017.083 7.082z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <input
          ref={inputRef}
          name="q"
          type="search"
          placeholder="Search or type command..."
          className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pr-16 pl-12 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none xl:w-[430px]"
        />
        <span className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-1 text-xs text-gray-500 sm:inline-flex">
          <span>⌘</span>
          <span>K</span>
        </span>
      </div>
    </form>
  );
}

export function DeskFrame({ children, notices = [] }: { children: React.ReactNode; notices?: DeskNoticeItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setToolsOpen(false);
    setBellOpen(false);
    setUserOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    function onDown(event: MouseEvent) {
      const target = event.target as Node;
      if (bellRef.current && !bellRef.current.contains(target)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(target)) setUserOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  return (
    <div className="desk-admin min-h-screen bg-gray-50 text-gray-800">
      {open ? (
        <button type="button" className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} />
      ) : null}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen w-[290px] flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-linear lg:translate-x-0 ${collapsed ? "lg:w-[90px]" : ""} ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`flex items-center px-5 py-8 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/magpie-logo-purple.png" alt="Magpie Studio" className={`h-8 w-auto ${collapsed ? "lg:hidden" : ""}`} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/magpie-mark.png" alt="" className={`hidden h-8 w-8 ${collapsed ? "lg:block" : ""}`} />
          </Link>
        </div>
        <div className={`no-scrollbar flex flex-1 flex-col overflow-y-auto duration-300 ease-linear ${collapsed ? "px-5 lg:px-3" : "px-5"}`}>
          <nav className="mb-6">
            <h2 className={`mb-4 text-xs leading-5 text-gray-400 uppercase ${collapsed ? "lg:text-center" : ""}`}>
              <span className={collapsed ? "lg:hidden" : ""}>Menu</span>
              {collapsed ? <span className="hidden lg:inline">•••</span> : null}
            </h2>
            <ul className="flex flex-col gap-1">
              {links.map((link) => {
                const on = active(link.href, pathname);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      title={link.label}
                      className={`group menu-item ${on ? "menu-item-active" : "menu-item-inactive"} ${collapsed ? "lg:justify-center" : ""}`}
                    >
                      <span className={on ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                        <Icon name={link.icon} />
                      </span>
                      <span className={`menu-item-text ${collapsed ? "lg:hidden" : ""}`}>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      <div className={`transition-[padding] duration-300 ease-linear ${collapsed ? "lg:ps-[90px]" : "lg:ps-[290px]"}`}>
        <header className="sticky top-0 z-30 flex w-full bg-white lg:border-b lg:border-gray-200">
          <div className="flex grow flex-col items-center justify-between xl:flex-row xl:px-6">
            <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 xl:justify-normal xl:border-b-0 xl:px-0 xl:py-4">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100"
                aria-label={open ? "Close sidebar" : "Toggle sidebar"}
                onClick={() => {
                  if (window.matchMedia("(min-width: 1024px)").matches) setCollapsed((value) => !value);
                  else setOpen((value) => !value);
                }}
              >
                {open ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor" />
                  </svg>
                )}
              </button>
              <Link href="/" className="xl:hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/magpie-logo-purple.png" alt="Magpie Studio" className="h-8 w-auto" />
              </Link>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 xl:hidden"
                aria-label="Toggle header menu"
                onClick={() => setToolsOpen((value) => !value)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="5" cy="12" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="19" cy="12" r="1.6" />
                </svg>
              </button>
              <SearchForm className="hidden xl:block" inputRef={searchRef} />
            </div>

            <div className={`${toolsOpen ? "flex" : "hidden"} w-full items-center justify-between gap-4 px-5 py-4 shadow-theme-md xl:flex xl:justify-end xl:px-0 xl:py-0 xl:shadow-none`}>
              <SearchForm className="min-w-0 flex-1 xl:hidden" />
              <div className="flex items-center gap-3">
                <div className="relative" ref={bellRef}>
                  <button
                    type="button"
                    className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100"
                    aria-label="Notifications"
                    aria-expanded={bellOpen}
                    onClick={() => {
                      setBellOpen((value) => !value);
                      setUserOpen(false);
                    }}
                  >
                    {notices.length > 0 ? (
                      <span className="absolute top-0 right-0 z-10 h-2.5 w-2.5 translate-x-1/4 -translate-y-1/4 rounded-full bg-orange-400">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                      </span>
                    ) : null}
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M9.861 1.876v1.25m0 0a5.625 5.625 0 015.625 5.625v6.041H4.236V8.751a5.625 5.625 0 015.625-5.625zm-1.25 14.166h2.5m-7.917-2.5h13.334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {bellOpen ? (
                    <div className="absolute right-0 z-50 mt-3 w-[350px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg sm:w-[361px]">
                      <div className="flex items-center justify-between pb-3">
                        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                        <button type="button" className="rounded-lg p-1 text-gray-500 hover:bg-gray-100" aria-label="Close notifications" onClick={() => setBellOpen(false)}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto border-t border-gray-100">
                        {notices.length === 0 ? (
                          <p className="px-2 py-6 text-sm text-gray-500">No new notifications.</p>
                        ) : (
                          <ul>
                            {notices.map((notice) => (
                              <li key={notice.id} className="border-b border-gray-100 last:border-b-0">
                                <Link href={`/requirements/${notice.requirementId}`} className="block rounded-lg px-2 py-3 hover:bg-gray-100" onClick={() => setBellOpen(false)}>
                                  <p className="text-sm text-gray-500">
                                    <span className="font-medium text-gray-800">{notice.requirementNumber}</span> {notice.message}
                                  </p>
                                  <p className="mt-1.5 text-xs text-gray-500">{notice.when}</p>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <Link href="/" className="mt-3 flex h-11 w-full items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50" onClick={() => setBellOpen(false)}>
                        View all
                      </Link>
                    </div>
                  ) : null}
                </div>

                <div className="relative" ref={userRef}>
                  <button
                    type="button"
                    className="flex items-center text-gray-700"
                    aria-label="Account menu"
                    aria-expanded={userOpen}
                    onClick={() => {
                      setUserOpen((value) => !value);
                      setBellOpen(false);
                    }}
                  >
                    <span className="me-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-sm font-semibold text-brand-500">A</span>
                    <span className="me-1 hidden text-sm font-medium sm:block">Admin</span>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={`text-gray-500 transition-transform ${userOpen ? "rotate-180" : ""}`} aria-hidden="true">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {userOpen ? (
                    <div className="absolute right-0 z-50 mt-3 w-[260px] rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg">
                      <div className="px-3 py-2">
                        <span className="block text-sm font-medium text-gray-700">Admin</span>
                        <span className="mt-0.5 block text-xs text-gray-500">Magpie Studio</span>
                      </div>
                      <div className="my-2 h-px bg-gray-100" />
                      <form action={logout}>
                        <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M9 6H6.5A1.5 1.5 0 005 7.5v9A1.5 1.5 0 006.5 18H9M10 12h9M16 8l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Log out
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
