import { AlertTriangle, CheckCircle2, Settings2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTHB } from "@/lib/utils";
import type { Plan } from "@/lib/data/types";

const envNames: Record<string, string> = {
  "7-days": "STORE_PRICE_7_DAYS_SATANG",
  "30-days": "STORE_PRICE_30_DAYS_SATANG",
  "365-days": "STORE_PRICE_365_DAYS_SATANG",
};

export function AdminProducts({ plans, checkoutEnabled }: { plans: Plan[]; checkoutEnabled: boolean }) {
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  const supabaseReady = Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
  const publicPlans = plans.filter((plan) => plan.visible);
  const pricesReady = plans.every((plan) => !plan.isPlaceholderPrice);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="สถานะหน้าร้าน" />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-line/10 bg-surface-2 p-4">
              <p className="text-sm text-muted">Checkout</p>
              <div className="mt-2">{checkoutEnabled ? <Badge tone="success"><CheckCircle2 className="size-3.5" />เปิด</Badge> : <Badge tone="warning"><AlertTriangle className="size-3.5" />ปิดอยู่</Badge>}</div>
            </div>
            <div className="rounded-lg border border-line/10 bg-surface-2 p-4">
              <p className="text-sm text-muted">ราคาจริง</p>
              <div className="mt-2">{pricesReady ? <Badge tone="success">กำหนดแล้ว</Badge> : <Badge tone="warning">ยังมีราคาตัวอย่าง</Badge>}</div>
            </div>
            <div className="rounded-lg border border-line/10 bg-surface-2 p-4">
              <p className="text-sm text-muted">Stripe secrets</p>
              <div className="mt-2">{stripeReady ? <Badge tone="success">ตั้งค่าแล้ว</Badge> : <Badge tone="warning">ต้องตรวจสอบ</Badge>}</div>
            </div>
            <div className="rounded-lg border border-line/10 bg-surface-2 p-4">
              <p className="text-sm text-muted">Supabase server key</p>
              <div className="mt-2">{supabaseReady ? <Badge tone="success">ตั้งค่าแล้ว</Badge> : <Badge tone="warning">ต้องตรวจสอบ</Badge>}</div>
            </div>
          </div>
          {!pricesReady || !stripeReady || !supabaseReady || !checkoutEnabled ? <p className="mt-4 rounded-md border border-warning/20 bg-warning/5 p-3 text-sm text-muted">
            <AlertTriangle className="mr-2 inline size-4 text-warning" aria-hidden />
            ร้านยังไม่พร้อมรับชำระเงิน อย่าเปิด Checkout จนกว่าจะตั้งค่า Stripe, webhook และ Supabase server key ครบ ตรวจสอบราคาให้ตรง และทดสอบการชำระเงินจริง/การออกไลเซนส์ครบ
          </p> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="แพ็กเกจที่กำหนดไว้" />
        <div className="divide-y divide-line/10">
          {plans.map((plan) => <div key={plan.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{plan.name}</h2>{plan.highlight && <Badge tone="accent">แนะนำ</Badge>}{plan.isPlaceholderPrice && <Badge tone="warning">ราคาตัวอย่าง</Badge>}</div>
              <p className="mt-1 text-sm text-muted">{plan.durationDays} วัน · {plan.tagline}</p>
              <p className="mt-2 break-all font-mono text-xs text-faint">{envNames[plan.slug] ?? "กำหนดผ่านตัวแปรสภาพแวดล้อม"}</p>
            </div>
            <div className="sm:text-right"><p className="text-xl font-semibold tabular-nums">{formatTHB(plan.priceSatang)}</p><p className="mt-1 text-xs text-muted">{plan.visible ? "แสดงบนหน้าราคา" : "ซ่อนจากหน้าราคา"}</p></div>
          </div>)}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex gap-3">
          <Settings2 className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
          <div className="space-y-2">
            <h2 className="font-semibold">แก้ไขราคาและสถานะ Checkout</h2>
            <p className="text-sm text-muted">ค่าเหล่านี้ถูกอ่านจาก Environment Variables ของ Vercel เพื่อให้ราคาที่หน้าร้านไม่สามารถเปลี่ยนจากเบราว์เซอร์แล้วคิดเงินคนละราคาได้</p>
            <p className="text-sm text-muted">ใน Vercel → Project <code>ig-snapper</code> → Settings → Environment Variables ให้กำหนดราคาจริงในหน่วยสตางค์: 1 บาท = 100 สตางค์</p>
            <p className="text-sm text-muted">หลังบันทึกค่า ให้ redeploy โปรเจกต์ ค่าใหม่จึงมีผลกับเว็บที่เผยแพร่</p>
          </div>
        </div>
      </Card>
      {publicPlans.length === 0 && <p className="text-sm text-muted">ไม่มีแพ็กเกจที่แสดงบนหน้าราคา</p>}
    </div>
  );
}
