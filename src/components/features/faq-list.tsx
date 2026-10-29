"use client";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { faqCategories, type Faq } from "@/content/faq";

export function FaqAccordion({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-line/10 rounded-lg border border-line/10 bg-surface">
      {items.map((f) => (
        <details key={f.id} className="group px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown className="size-4 shrink-0 text-faint transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="max-w-prose pb-5 text-[15px] text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function FaqExplorer({ items }: { items: Faq[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((f) => (cat === "all" || f.category === cat) && (!needle || (f.q + f.a).toLowerCase().includes(needle)));
  }, [items, q, cat]);

  return (
    <div className="space-y-5">
      <SearchInput label="ค้นหาคำถาม" placeholder="ค้นหาคำถาม เช่น คืนเงิน, หมดอายุ" value={q} onChange={(e) => setQ(e.target.value)} />
      <div role="group" aria-label="หมวดหมู่" className="flex flex-wrap gap-2">
        {faqCategories.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
            className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", cat === c.id ? "border-accent/50 bg-accent/15 text-ink" : "border-line/12 text-muted hover:text-ink")}>
            {c.label}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">พบ {shown.length} คำถาม</p>
      {shown.length ? <FaqAccordion items={shown} /> : <div className="rounded-lg border border-line/10 bg-surface"><EmptyState title="ไม่พบคำถามที่ตรงกับการค้นหา" description="ลองใช้คำอื่น หรือดูศูนย์ช่วยเหลือเพื่อติดต่อเรา" /></div>}
    </div>
  );
}
