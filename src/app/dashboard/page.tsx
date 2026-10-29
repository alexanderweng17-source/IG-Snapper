import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, KeyRound, LifeBuoy, Download, ShoppingBag } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PaymentStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { data } from "@/lib/data";
import { daysUntil, formatDate, formatDateTime, formatTHB } from "@/lib/utils";

export const metadata: Metadata = { title: "ภาพรวม" };

export default async function DashboardHome() {
  const s = await data.getDashboardSummary();
  const left = s.nextExpiry ? daysUntil(s.nextExpiry.expiresAt, new Date()) : null;
  const quick = [
    { href: "/pricing", label: "ซื้อไลเซนส์เพิ่ม", icon: ShoppingBag },
    { href: "/dashboard/licenses", label: "ดูคีย์ของฉัน", icon: KeyRound },
    { href: "/download", label: "ดาวน์โหลดและติดตั้ง", icon: Download },
    { href: "/dashboard/support", label: "ติดต่อฝ่ายช่วยเหลือ", icon: LifeBuoy },
  ];
  return (
    <>
      <PageHeading title={`สวัสดี คุณ${s.customerName}`} description="สรุปไลเซนส์และคำสั่งซื้อล่าสุดของคุณ" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5"><p className="flex items-center gap-2 text-sm text-muted"><KeyRound className="size-4" aria-hidden />ไลเซนส์ที่ใช้งานได้</p><p className="mt-2 text-3xl font-semibold tabular-nums">{s.activeLicenses}</p></Card>
        <Card className="p-5">
          <p className="flex items-center gap-2 text-sm text-muted"><CalendarClock className="size-4" aria-hidden />ใกล้หมดอายุที่สุด</p>
          {s.nextExpiry ? <><p className="mt-2 text-3xl font-semibold tabular-nums">อีก {left} วัน</p><p className={`mt-1 text-sm ${left !== null && left <= 7 ? "text-warning" : "text-faint"}`}>ไลเซนส์ {s.nextExpiry.planName} · {formatDate(s.nextExpiry.expiresAt)}</p></> : <p className="mt-2 text-muted">ไม่มี</p>}
        </Card>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quick.map((q) => (
          <Link key={q.href} href={q.href} className="group flex items-center gap-3 rounded-lg border border-line/10 bg-surface p-4 transition-colors hover:border-accent/40 hover:bg-surface-2">
            <q.icon className="size-5 text-accent" aria-hidden /><span className="flex-1 text-sm font-medium">{q.label}</span><ArrowRight className="size-4 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="คำสั่งซื้อล่าสุด" action={<ButtonLink href="/dashboard/orders" variant="ghost" size="sm">ดูทั้งหมด</ButtonLink>} />
          <ul className="divide-y divide-line/10">
            {s.recentOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                <div><p className="font-mono text-[13px]">{o.number}</p><p className="text-sm text-muted">ไลเซนส์ {o.planName} · {formatDate(o.createdAt)}</p></div>
                <div className="flex items-center gap-3"><span className="text-sm tabular-nums">{formatTHB(o.amountSatang)}</span><PaymentStatusBadge status={o.paymentStatus} /></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="กิจกรรมล่าสุด" />
          <CardBody>
            <ol className="space-y-4">
              {s.activity.map((a) => (
                <li key={a.id} className="relative pl-5 text-sm before:absolute before:left-0 before:top-2 before:size-2 before:rounded-full before:bg-accent/70">
                  <p>{a.text}</p><p className="text-xs text-faint">{formatDateTime(a.at)}</p>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
