"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, LayoutDashboard } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function AccountMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-surface-3 hover:text-ink";
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="เมนูบัญชี"
        className="flex items-center gap-2 rounded-full border border-line/12 bg-surface-2 py-1 pl-1 pr-3 hover:border-line/25">
        <span className="grid size-7 place-items-center rounded-full bg-accent/25 text-sm font-semibold text-[rgb(200_190_255)]">{name.trim().charAt(0)}</span>
        <span className="hidden max-w-32 truncate text-sm sm:block">{name}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 animate-pop-in rounded-lg border border-line/12 bg-surface-2 p-1.5 shadow-pop">
          <div className="border-b border-line/10 px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-faint">{email}</p>
          </div>
          <div className="pt-1.5">
            <Link role="menuitem" href="/dashboard" className={item} onClick={() => setOpen(false)}><LayoutDashboard className="size-4" aria-hidden />แดชบอร์ด</Link>
            <Link role="menuitem" href="/dashboard/profile" className={item} onClick={() => setOpen(false)}><User className="size-4" aria-hidden />ตั้งค่าบัญชี</Link>
            <button role="menuitem" className={item} onClick={() => { setOpen(false); toast("ออกจากระบบแล้ว (จำลอง — ยังไม่ได้เชื่อมต่อระบบยืนยันตัวตน)", "info"); router.push("/login"); }}>
              <LogOut className="size-4" aria-hidden />ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
