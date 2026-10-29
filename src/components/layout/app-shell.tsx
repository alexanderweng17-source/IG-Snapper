"use client";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "./nav-link";
import { AccountMenu } from "./account-menu";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export interface ShellNavItem { href: string; label: string; icon: React.ReactNode; exact?: boolean }

/**
 * Shared shell for /dashboard and /admin:
 * desktop → fixed sidebar; mobile → compact top bar + bottom tab bar.
 */
export function AppShell({ items, children, area, user }: { items: ShellNavItem[]; children: React.ReactNode; area: "customer" | "admin"; user: { name: string; email: string } }) {
  const side = "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink";
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink">{t.nav.skip}</a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line/10 bg-surface/60 lg:flex">
        <div className="flex h-16 items-center border-b border-line/10 px-5"><Logo href={area === "admin" ? "/admin" : "/dashboard"} /></div>
        {area === "admin" && <div className="px-5 pt-4"><Badge tone="warning">ต้นแบบผู้ดูแลระบบ</Badge></div>}
        <nav aria-label="เมนูแดชบอร์ด" className="flex-1 space-y-1 p-3">
          {items.map((i) => (
            <NavLink key={i.href} href={i.href} exact={i.exact} className={side} activeClassName="bg-accent/12 text-ink [&_svg]:text-accent">
              {i.icon}{i.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line/10 p-3 text-sm">
          <Link href="/" className={side}>← กลับสู่เว็บไซต์</Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line/10 bg-bg/85 px-4 backdrop-blur-md sm:px-6 lg:justify-end">
          <div className="lg:hidden"><Logo href={area === "admin" ? "/admin" : "/dashboard"} /></div>
          <AccountMenu name={user.name} email={user.email} />
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:pb-10">{children}</main>
      </div>

      <nav aria-label="เมนูแดชบอร์ด (มือถือ)" className="fixed inset-x-0 bottom-0 z-40 border-t border-line/12 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <ul className="mx-auto flex max-w-lg justify-around">
          {items.map((i) => (
            <li key={i.href} className="flex-1">
              <NavLink href={i.href} exact={i.exact} className={cn("flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] text-faint")} activeClassName="text-accent">
                {i.icon}<span className="max-w-full truncate">{i.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
