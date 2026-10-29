import type { Metadata } from "next";
import { AlertTriangle, CircleDollarSign, KeyRound, ReceiptText, Users } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { DemoBanner } from "@/components/ui/demo-banner";
import { PaymentStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { data } from "@/lib/data";
import { formatDate, formatTHB } from "@/lib/utils";
import { t } from "@/i18n";

export const metadata: Metadata = { title: "ผู้ดูแล · ภาพรวม" };

export default async function AdminHome() {
  const s = await data.getAdminSummary();
  const cards = [
    { label: "รายได้ (ชำระแล้ว)", value: formatTHB(s.revenueSatang), icon: CircleDollarSign },
    { label: "คำสั่งซื้อที่ชำระแล้ว", value: String(s.paidOrders), icon: ReceiptText },
    { label: "ไลเซนส์ที่ใช้งานได้", value: String(s.activeLicenses), icon: KeyRound },
    { label: "ลูกค้า", value: String(s.customers), icon: Users },
  ];
  return (
    <>
      <DemoBanner>{t.demo.bannerAdmin}</DemoBanner>
      <PageHeading title="ภาพรวมผู้ดูแลระบบ" description="ข้อมูลตัวอย่างสำหรับต้นแบบ" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => <Card key={c.label} className="p-5"><p className="flex items-center gap-2 text-sm text-muted"><c.icon className="size-4" aria-hidden />{c.label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{c.value}</p></Card>)}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title="คำสั่งซื้อล่าสุด" action={<ButtonLink href="/admin/orders" variant="ghost" size="sm">ดูทั้งหมด</ButtonLink>} />
          <ul className="divide-y divide-line/10">
            {s.recentOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                <div><p className="font-mono text-[13px]">{o.number}</p><p className="text-sm text-muted">{o.customerEmail} · {formatDate(o.createdAt)}</p></div>
                <div className="flex items-center gap-3"><span className="text-sm tabular-nums">{formatTHB(o.amountSatang)}</span><PaymentStatusBadge status={o.paymentStatus} /></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="รายการที่ต้องติดตาม" />
          <ul className="divide-y divide-line/10">
            {s.attention.map((a) => (
              <li key={a.id} className="flex gap-3 px-5 py-3.5"><AlertTriangle className={`mt-0.5 size-4 shrink-0 ${a.tone === "danger" ? "text-danger" : "text-warning"}`} aria-hidden /><div><p className="text-sm font-medium">{a.label}</p><p className="text-sm text-muted">{a.detail}</p></div></li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
