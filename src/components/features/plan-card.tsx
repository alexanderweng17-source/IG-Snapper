import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatTHB, cn } from "@/lib/utils";
import { product } from "@/content/site";
import type { Plan } from "@/lib/data/types";

/** Included in every plan — only confirmed features. Plans differ by duration only. */
export const planIncludes = [
  "ทุกฟีเจอร์ของ IG Snapper เวอร์ชัน " + product.version,
  `1 คีย์ ใช้ได้ ${product.defaultActivation.accounts} บัญชี Instagram / ${product.defaultActivation.browsers} เบราว์เซอร์ (ค่าเริ่มต้น)`,
  "ชำระครั้งเดียว ไม่ต่ออายุอัตโนมัติ",
  "ดูคีย์และสถานะได้ในหน้า “ไลเซนส์ของฉัน”",
];

export function PlanCard({ plan, compact = false }: { plan: Plan; compact?: boolean }) {
  const perDay = plan.priceSatang / plan.durationDays;
  return (
    <article className={cn("relative flex flex-col rounded-xl border bg-surface p-6 shadow-card", plan.highlight ? "border-accent/50 ring-1 ring-accent/30" : "border-line/10")}>
      {plan.highlight && <Badge tone="accent" className="absolute -top-3 left-6">แนะนำ</Badge>}
      <h3 className="text-lg font-semibold">ไลเซนส์ {plan.name}</h3>
      <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
      <p className="mt-5 flex items-baseline gap-2">
        <span className="text-4xl font-semibold tracking-tight">{formatTHB(plan.priceSatang)}</span>
        <span className="text-sm text-muted">/ {plan.durationDays} วัน</span>
      </p>
      <p className="mt-1 text-sm text-faint">≈ {formatTHB(Math.round(perDay))} ต่อวัน{plan.isPlaceholderPrice && " · ราคาตัวอย่าง (ยังไม่ใช่ราคาจริง)"}</p>
      {!compact && (
        <ul className="mt-6 space-y-2.5 border-t border-line/10 pt-5 text-sm">
          {planIncludes.map((f) => (
            <li key={f} className="flex gap-2.5 text-muted"><Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />{f}</li>
          ))}
        </ul>
      )}
      <ButtonLink href={`/checkout?plan=${plan.slug}`} variant={plan.highlight ? "primary" : "secondary"} size="lg" className="mt-6 w-full">
        ซื้อแพ็กเกจ {plan.name}
      </ButtonLink>
    </article>
  );
}
