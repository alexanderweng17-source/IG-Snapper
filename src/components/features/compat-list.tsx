import { CheckCircle2, CircleHelp, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { compatibility } from "@/content/site";

const meta = {
  supported: { tone: "success" as const, label: "รองรับ", Icon: CheckCircle2 },
  untested: { tone: "warning" as const, label: "ยังไม่ได้ยืนยัน", Icon: CircleHelp },
  unsupported: { tone: "neutral" as const, label: "ยังไม่รองรับ", Icon: XCircle },
};

export function CompatList() {
  return (
    <ul className="divide-y divide-line/10 rounded-lg border border-line/10 bg-surface">
      {compatibility.map((c) => {
        const m = meta[c.status];
        return (
          <li key={c.name} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-muted">{c.note}</p>
            </div>
            <Badge tone={m.tone}><m.Icon className="size-3.5" aria-hidden />{m.label}</Badge>
          </li>
        );
      })}
    </ul>
  );
}
