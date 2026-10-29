import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { FaqExplorer } from "@/components/features/faq-list";
import { ButtonLink } from "@/components/ui/button";
import { faqs } from "@/content/faq";

export const metadata: Metadata = { title: "คำถามที่พบบ่อย" };

export default function FaqPage() {
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <PageHeading crumbs={[{ label: "หน้าแรก", href: "/" }, { label: "คำถามที่พบบ่อย" }]} title="คำถามที่พบบ่อย" description="ค้นหาหรือเลือกหมวดหมู่ หากไม่พบคำตอบ ติดต่อฝ่ายช่วยเหลือได้" />
      <FaqExplorer items={faqs} />
      <div className="mt-10"><ButtonLink href="/dashboard/support" variant="secondary">ไปที่ศูนย์ช่วยเหลือ</ButtonLink></div>
    </div>
  );
}
