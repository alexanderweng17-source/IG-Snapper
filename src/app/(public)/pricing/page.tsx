import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { PlanCard } from "@/components/features/plan-card";
import { PageHeading } from "@/components/ui/page-heading";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ราคา" };

export default async function PricingPage() {
  const plans = await data.listPlans();
  return (
    <div className="container-page py-12 sm:py-16">
      <PageHeading crumbs={[{ label: "หน้าแรก", href: "/" }, { label: "ราคา" }]} title="เลือกแพ็กเกจไลเซนส์" description="ซื้อครั้งเดียวต่อหนึ่งระยะเวลา ไม่มีการตัดเงินอัตโนมัติ ไม่มีกระเป๋าเงินหรือการเติมเงิน ทุกแพ็กเกจมีฟีเจอร์เหมือนกัน ต่างกันที่ระยะเวลา" />
      {plans.some((p) => p.isPlaceholderPrice) && <div role="note" className="mb-10 flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning">
        <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>ราคาที่แสดงบางรายการยังเป็นตัวอย่าง ร้านจะไม่เปิดรับชำระเงินจนกว่าจะกำหนดราคาจริงและเปิด Checkout</p>
      </div>}
      <div className="grid gap-6 md:grid-cols-3">{plans.map((p) => <PlanCard key={p.id} plan={p} />)}</div>
      <p className="mt-8 max-w-2xl text-sm text-muted">
        วิธีชำระเงิน: ผ่าน Stripe Checkout โดย PromptPay และบัตรจะแสดงตามวิธีที่เปิดใช้งานและสิทธิ์ของบัญชีผู้รับชำระเงิน อ่าน <Link href="/legal/refunds" className="text-accent hover:underline">นโยบายการคืนเงิน (ฉบับร่าง)</Link> ก่อนสั่งซื้อ
      </p>
    </div>
  );
}
