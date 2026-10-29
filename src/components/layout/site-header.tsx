"use client";

import { useEffect, useState } from "react";
import { LogOut, Menu, UserRound } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { NavLink } from "./nav-link";
import { t } from "@/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "หน้าแรก", exact: true },
  { href: "/pricing", label: t.nav.pricing },
  { href: "/download", label: t.nav.download },
  { href: "/faq", label: t.nav.faq },
  { href: "/dashboard", label: "แดชบอร์ด" },
];
const linkCls = "rounded-lg px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-ink";
const activeCls = "bg-surface-2 text-ink";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserEmail(data.user?.email ?? null);
    }).catch(() => { /* keep the signed-out header if session lookup fails */ });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    setOpen(false);
    window.location.assign("/");
  }

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink">{t.nav.skip}</a>
      <header className="sticky top-0 z-40 border-b border-line/10 bg-bg/90 backdrop-blur-xl">
        <div className="container-page flex h-[60px] items-center justify-between gap-3">
          <div className="flex shrink-0 items-center gap-5">
            <Logo />
            <nav aria-label="เมนูหลัก" className="hidden items-center gap-1 lg:flex">
              {links.slice(0, 4).map((l) => <NavLink key={l.href} href={l.href} exact={l.exact} className={linkCls} activeClassName={activeCls}>{l.label}</NavLink>)}
            </nav>
          </div>
          <div className="hidden items-center gap-1.5 lg:flex">
            {userEmail ? (
              <>
                <NavLink href="/dashboard" className={linkCls} activeClassName={activeCls}><span className="inline-flex items-center gap-1.5"><UserRound className="size-4" aria-hidden />บัญชีของฉัน</span></NavLink>
                <span className="max-w-40 truncate px-2 text-xs text-faint" title={userEmail}>{userEmail}</span>
                <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 size-4" aria-hidden />ออกจากระบบ</Button>
              </>
            ) : (
              <>
                <NavLink href="/dashboard" className={linkCls} activeClassName={activeCls}>แดชบอร์ด</NavLink>
                <ButtonLink href="/login" variant="ghost" size="sm">เข้าสู่ระบบ</ButtonLink>
                <ButtonLink href="/register" size="sm">สมัครสมาชิก</ButtonLink>
              </>
            )}
          </div>
          <button onClick={() => setOpen(true)} aria-label={t.nav.openMenu} aria-haspopup="dialog"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-line/12 text-ink lg:hidden">
            <Menu className="size-5" aria-hidden />
          </button>
        </div>
      </header>
      <Modal open={open} onClose={() => setOpen(false)} title="เมนู" variant="drawer">
        <nav aria-label="เมนูมือถือ" className="flex flex-col gap-1" onClick={() => setOpen(false)}>
          {links.map((l) => <NavLink key={l.href} href={l.href} exact={l.exact} className="rounded-md px-3 py-3 text-base text-muted hover:bg-surface-2 hover:text-ink" activeClassName="bg-surface-2 text-ink">{l.label}</NavLink>)}
          <div className="mt-4 grid gap-2">
            {userEmail ? (
              <>
                <p className="truncate px-3 text-sm text-muted">{userEmail}</p>
                <ButtonLink href="/dashboard" size="lg">บัญชีของฉัน</ButtonLink>
                <Button variant="secondary" size="lg" onClick={signOut}><LogOut className="mr-2 size-4" aria-hidden />ออกจากระบบ</Button>
              </>
            ) : (
              <>
                <ButtonLink href="/login" variant="secondary" size="lg">เข้าสู่ระบบ</ButtonLink>
                <ButtonLink href="/register" size="lg">สมัครสมาชิก</ButtonLink>
              </>
            )}
            <ButtonLink href="/pricing" variant="ghost" size="lg">ดูแพ็กเกจ</ButtonLink>
          </div>
        </nav>
      </Modal>
    </>
  );
}
