"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/UserMenu";

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/shifts", label: "Schichten" },
  { href: "/add", label: "Neue Schicht" },
  { href: "/analytics", label: "Analytics" },
  
];

export default function AppHeader() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href="/"
            className="shrink-0 text-xl font-black tracking-tight text-white"
          >
            ShiftFlow
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <UserMenu />
      </div>

      <nav className="flex gap-2 overflow-x-auto px-5 pb-3 lg:hidden">
        {navigation.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-xl px-3 py-2 text-sm ${
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-400"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}