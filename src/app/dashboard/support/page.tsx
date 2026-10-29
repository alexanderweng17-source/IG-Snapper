import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Mail, MessageCircle } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { DemoBanner } from "@/components/ui/demo-banner";
import { SupportForm } from "@/components/features/support-form";
import { support } from "@/content/site";
import { t } from "@/i18n";

export const metadata: Metadata = { title: "ศูนย์ช่วยเหลือ" };

const channels = [
  { icon: Mail, label: "อีเมล", value: support.email },
  { icon: MessageCircle, label: "LINE / Discord", value: support.line || support.discord },
];

export default function SupportPage() {
  return (
    <>
      <DemoBanner>{t.demo.bannerDashboard}</DemoBanner>
      <PageHeading crumbs={[{ label: "แดชบอร์ด", href: "/dashboard" }, { label: "ศูนย์ช่วยเหลือ" }]} title="ศูนย์ช่วยเหลือ" description="ดูคำตอบจากคำถามที่พบบ่อยก่อน หรือติดต่อทีมงาน" />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="ช่องทางติดต่อ" />
            <ul className="divide-y divide-line/10">
              {channels.map((c) => (
                <li key={c.label} className="flex items-center gap-3 px-5 py-4"><c.icon className="size-5 text-accent" aria-hidden /><div><p className="text-sm font-medium">{c.label}</p><p className="text-sm text-muted">{c.value || "จะประกาศก่อนเปิดขาย (ยังไม่ได้กำหนด)"}</p></div></li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="อ่านก่อนติดต่อ" />
            <CardBody className="space-y-2 text-sm">
              {[["/faq", "คำถามที่พบบ่อย"], ["/download", "วิธีติดตั้งและอัปเดต"], ["/legal/refunds", "นโยบายการคืนเงิน (ฉบับร่าง)"]].map(([h, l]) => (
                <Link key={h} href={h} className="flex items-center gap-2 text-muted hover:text-ink"><BookOpen className="size-4 text-accent" aria-hidden />{l}</Link>
              ))}
            </CardBody>
          </Card>
        </div>
        <Card><CardHeader title="ส่งคำขอความช่วยเหลือ" /><CardBody><SupportForm /></CardBody></Card>
      </div>
    </>
  );
}
