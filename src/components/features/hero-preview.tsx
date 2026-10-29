import { UserMinus, Camera } from "lucide-react";

/** Decorative concept illustration with fictional usernames — NOT a screenshot of the real UI. */
export function HeroPreview() {
  const rows = [
    { u: "sample.user_01", s: "เลิกติดตามคุณ", tone: "text-danger" },
    { u: "demo.account", s: "เลิกติดตามคุณ", tone: "text-danger" },
    { u: "example_shop", s: "ติดตามใหม่", tone: "text-success" },
  ];
  return (
    <figure aria-label="ภาพประกอบแนวคิดการเปรียบเทียบสแนปช็อต" className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_70%_20%,rgb(143_123_255/0.22),transparent)]" aria-hidden />
      <div className="overflow-hidden rounded-2xl border border-line/12 bg-surface shadow-pop">
        <div className="flex items-center justify-between border-b border-line/10 bg-surface-2 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium"><Camera className="size-4 text-accent" aria-hidden />เปรียบเทียบสแนปช็อต</span>
          <span className="text-xs text-faint">ข้อมูลสมมติ</span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-line/10 border-b border-line/10">
          {[["ครั้งก่อน", "1,284"], ["ล่าสุด", "1,281"]].map(([l, n]) => (
            <div key={l} className="px-4 py-4"><p className="text-xs text-faint">{l}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{n}</p><p className="text-xs text-muted">ผู้ติดตาม</p></div>
          ))}
        </div>
        <ul className="divide-y divide-line/10">
          {rows.map((r) => (
            <li key={r.u} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-surface-3 text-muted"><UserMinus className="size-4" aria-hidden /></span><span className="font-mono text-sm">@{r.u}</span></span>
              <span className={`text-xs font-medium ${r.tone}`}>{r.s}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-3 text-center text-xs text-faint">ภาพประกอบเพื่ออธิบายแนวคิด ไม่ใช่ภาพหน้าจอจริงของโปรแกรม</figcaption>
    </figure>
  );
}
