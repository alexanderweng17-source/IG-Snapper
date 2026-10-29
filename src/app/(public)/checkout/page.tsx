import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { CheckoutHandoff } from "@/components/features/checkout-handoff";
import { data } from "@/lib/data";
import { formatTHB } from "@/lib/utils";
import { checkoutIsEnabled } from "@/lib/store/plans";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "สรุปคำสั่งซื้อ" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: slug } = await searchParams;
  const plan = slug ? await data.getPlan(slug) : null;
  const crumbs = [{ label: "ราคา", href: "/pricing" }, { label: "สรุปคำสั่งซื้อ" }];

  if (!plan) {
    return (
      <div className="container-page max-w-3xl py-16">
        <Card><EmptyState title="ยังไม่ได้เลือกแพ็กเกจ" description="กลับไปเลือกแพ็กเกจที่ต้องการก่อนดำเนินการต่อ" action={<ButtonLink href="/pricing">ดูแพ็กเกจ</ButtonLink>} /></Card>
      </div>
    );
  }
  const next = encodeURIComponent(`/checkout?plan=${plan.slug}`);
  const checkoutEnabled = checkoutIsEnabled(plan);
  return (
    <div className="container-page max-w-4xl py-12 sm:py-16">
      <PageHeading crumbs={crumbs} title="สรุปคำสั่งซื้อ" description="ตรวจสอบรายละเอียดก่อนไปชำระเงิน" />
      <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="1. แพ็กเกจที่เลือก" action={<Link href="/pricing" className="text-sm text-accent hover:underline">เปลี่ยน</Link>} />
            <CardBody>
              <p className="font-medium">ไลเซนส์ IG Snapper {plan.name}</p>
              <p className="mt-1 text-sm text-muted">ชำระครั้งเดียว ไม่ต่ออายุอัตโนมัติ ระยะเวลานับจากที่ระบบออกคีย์หลังยืนยันการชำระเงิน [ยืนยันกติกาการนับวันก่อนเปิดขาย]</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="2. บัญชีของคุณ" />
            <CardBody className="flex items-start gap-3 text-sm text-muted">
              <UserRound className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              <div>
                <p>ไลเซนส์จะถูกผูกกับบัญชีที่เข้าสู่ระบบ ต้องเข้าสู่ระบบก่อนชำระเงิน และจะดูคีย์ได้ในหน้าไลเซนส์ของฉันหลังยืนยันยอดสำเร็จ</p>
                <p className="mt-3 flex gap-2"><ButtonLink size="sm" variant="secondary" href={`/login?next=${next}`}>เข้าสู่ระบบ</ButtonLink><ButtonLink size="sm" variant="ghost" href={`/register?next=${next}`}>สมัครสมาชิก</ButtonLink></p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="3. ชำระเงินที่ Stripe" />
            <CardBody className="space-y-4 text-sm text-muted">
              <p className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />คุณจะถูกพาไปยังหน้าชำระเงินของ Stripe (PromptPay และบัตร ตามที่บัญชีผู้รับชำระเงินรองรับ) เว็บไซต์นี้ไม่รับข้อมูลบัตรหรือแสดง QR ชำระเงินเอง</p>
              <p className="flex gap-3"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />การกลับมาจาก Stripe ไม่ใช่หลักฐานการชำระเงิน คีย์จะออกหลังระบบหลังบ้านได้รับการยืนยันที่ตรวจสอบแล้วเท่านั้น</p>
            </CardBody>
          </Card>
        </div>

        <aside className="md:sticky md:top-24 md:self-start">
          <Card>
            <CardHeader title="สรุปราคา" />
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">ไลเซนส์ {plan.name}</span><span>{formatTHB(plan.priceSatang)}</span></div>
              <div className="flex justify-between border-t border-line/10 pt-3 text-base font-semibold"><span>รวม</span><span>{formatTHB(plan.priceSatang)}</span></div>
              {plan.isPlaceholderPrice && <p className="text-xs text-warning">ราคาตัวอย่าง ยังไม่ใช่ราคาจริง</p>}
              <CheckoutHandoff planSlug={plan.slug} enabled={checkoutEnabled} />
              <p className="text-center text-xs text-faint">การสั่งซื้อถือว่ารับทราบ <Link href="/legal/refunds" className="underline">นโยบายการคืนเงิน</Link> (ฉบับร่าง)</p>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
