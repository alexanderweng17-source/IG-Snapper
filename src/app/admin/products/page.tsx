import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { DemoBanner } from "@/components/ui/demo-banner";
import { AdminProducts } from "@/components/features/admin-products";
import { data } from "@/lib/data";
import { t } from "@/i18n";

export const metadata: Metadata = { title: "ผู้ดูแล · แพ็กเกจ" };

export default async function AdminProductsPage() {
  const plans = await data.listAllPlans();
  return (<><DemoBanner>{t.demo.bannerAdmin}</DemoBanner><PageHeading crumbs={[{ label: "ผู้ดูแล", href: "/admin" }, { label: "แพ็กเกจ" }]} title="จัดการแพ็กเกจ" description="แก้ไขชื่อ ระยะเวลา ราคาที่แสดง และการมองเห็น" /><AdminProducts plans={plans} /></>);
}
