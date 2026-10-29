import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, CircleDollarSign, KeyRound, ReceiptText, Settings2, Users } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PaymentStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { AdminDataWarning } from "@/components/features/admin-data-warning";
import { data } from "@/lib/data";
import { formatDate, formatTHB } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ผู้ดูแล · ภาพรวม" };

function configuredPrice(name: string) {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0;
}

export default async function AdminHome() {
  let summary = null;
  let dataUnavailable = false;
  try {
    summary = await data.getAdminSummary();
  } catch (error) {
    dataUnavailable = true;
    console.error("Admin dashboard data unavailable", error);
  }

  const checks = [
    { label: "Supabase server key", ready: Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY), detail: "อ่านข้อมูลคำสั่งซื้อและไลเซนส์" },
    { label: "Stripe API key", ready: Boolean(process.env.STRIPE_SECRET_KEY), detail: "เชื่อมต่อ Stripe Checkout" },
    { label: "Stripe webhook", ready: Boolean(process.env.STRIPE_WEBHOOK_SECRET), detail: "ยืนยันสถานะการชำระเงิน" },
    { label: "ราคาจริงทั้ง 3 แพ็กเกจ", ready: configuredPrice("STORE_PRICE_7_DAYS_SATANG") && configuredPrice("STORE_PRICE_30_DAYS_SATANG") && configuredPrice("STORE_PRICE_365_DAYS_SATANG"), detail: "ราคาในหน่วยสตางค์ ต้องตรงกับหน้าร้านและ Stripe" },
    { label: "Checkout", ready: process.env.STORE_CHECKOUT_ENABLED === "true", detail: process.env.STORE_CHECKOUT_ENABLED === "true" ? "เปิดรับชำระเงินอยู่" : "ปิดการรับชำระเงินอยู่" },
  ];

  const metricCards = summary ? [
    { label: "รายได้ที่ชำระแล้ว", value: formatTHB(summary.revenueSatang), icon: CircleDollarSign },
    { label: "คำสั่งซื้อที่ชำระแล้ว", value: String(summary.paidOrders), icon: ReceiptText },
    { label: "ไลเซนส์ที่ใช้งานได้", value: String(summary.activeLicenses), icon: KeyRound },
    { label: "ลูกค้าที่ลงทะเบียน", value: String(summary.customers), icon: Users },
  ] : [];

  return (
    <>
      <PageHeading title="ภาพรวมผู้ดูแลระบบ" description="ข้อมูลจาก Supabase และสถานะการตั้งค่าร้านค้า" />
      {dataUnavailable && <AdminDataWarning />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((item) => <Card key={item.label} className="p-5">
          <p className="flex items-center gap-2 text-sm text-muted"><item.icon className="size-4" aria-hidden />{item.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{item.value}</p>
        </Card>)}
        {summary && <Card className="p-5 sm:col-span-2 xl:col-span-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-semibold">สถานะระบบร้านค้า</p><p className="mt-1 text-sm text-muted">สถานะจาก Environment Variables ของ deployment นี้</p></div>
            <ButtonLink href="/admin/products" variant="secondary" size="sm"><Settings2 className="size-4" aria-hidden />ตั้งค่าราคา/สถานะ</ButtonLink>
          </div>
        </Card>}
      </div>

      <Card className="mt-6">
        <CardHeader title="รายการตรวจสอบระบบ" />
        <ul className="divide-y divide-line/10">
          {checks.map((item) => <li key={item.label} className="flex items-start gap-3 px-5 py-3.5">
            {item.ready ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />}
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.label}</p><p className="text-sm text-muted">{item.detail}</p></div>
            <span className={item.ready ? "text-xs font-medium text-success" : "text-xs font-medium text-warning"}>{item.ready ? "ตั้งค่าแล้ว" : "ต้องตรวจสอบ"}</span>
          </li>)}
        </ul>
      </Card>

      {summary && <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title="คำสั่งซื้อล่าสุด" action={<ButtonLink href="/admin/orders" variant="ghost" size="sm">ดูทั้งหมด</ButtonLink>} />
          {summary.recentOrders.length ? <ul className="divide-y divide-line/10">
            {summary.recentOrders.map((order) => <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0"><p className="font-mono text-[13px]">{order.number}</p><p className="text-sm text-muted">{order.customerEmail || "ไม่พบอีเมล"} · {formatDate(order.createdAt)}</p></div>
              <div className="flex items-center gap-3"><span className="text-sm tabular-nums">{formatTHB(order.amountSatang)}</span><PaymentStatusBadge status={order.paymentStatus} /></div>
            </li>)}
          </ul> : <p className="px-5 py-6 text-sm text-muted">ยังไม่มีคำสั่งซื้อในระบบ</p>}
        </Card>
        <Card>
          <CardHeader title="รายการที่ต้องติดตาม" />
          {summary.attention.length ? <ul className="divide-y divide-line/10">
            {summary.attention.map((item) => <li key={item.id} className="flex gap-3 px-5 py-3.5"><AlertTriangle className={`mt-0.5 size-4 shrink-0 ${item.tone === "danger" ? "text-danger" : "text-warning"}`} aria-hidden /><div><p className="text-sm font-medium">{item.label}</p><p className="text-sm text-muted">{item.detail}</p></div></li>)}
          </ul> : <p className="px-5 py-6 text-sm text-muted">ไม่มีรายการที่ต้องติดตามในขณะนี้</p>}
        </Card>
      </div>}
    </>
  );
}
