import Link from "next/link";
import { t } from "@/i18n";

const legalLinks = [
  ["/legal/terms", "ข้อกำหนดการใช้งาน"],
  ["/legal/privacy", "นโยบายความเป็นส่วนตัว"],
  ["/legal/refunds", "นโยบายการคืนเงิน"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line/10 bg-bg">
      <div className="container-page space-y-3 py-6 text-xs leading-relaxed text-faint">
        <p>{t.disclaimer}</p>
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
          <nav aria-label="ลิงก์กฎหมาย" className="flex flex-wrap gap-x-4 gap-y-1">
            {legalLinks.map(([href, label]) => <Link key={href} href={href} className="hover:text-ink">{label}</Link>)}
          </nav>
          <span>© 2026 IG Snapper. สงวนลิขสิทธิ์</span>
        </div>
      </div>
    </footer>
  );
}
