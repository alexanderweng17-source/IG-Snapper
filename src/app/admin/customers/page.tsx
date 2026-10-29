import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { DemoBanner } from "@/components/ui/demo-banner";
import { AdminCustomers } from "@/components/features/admin-customers";
import { data } from "@/lib/data";
import { t } from "@/i18n";

export const metadata: Metadata = { title: "ผู้ดูแล · ลูกค้า" };

export default async function AdminCustomersPage() {
  const customers = await data.listCustomers();
  return (<><DemoBanner>{t.demo.bannerAdmin}</DemoBanner><PageHeading crumbs={[{ label: "ผู้ดูแล", href: "/admin" }, { label: "ลูกค้า" }]} title="จัดการลูกค้า" /><AdminCustomers customers={customers} /></>);
}
