import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { DemoBanner } from "@/components/ui/demo-banner";
import { AdminLicenses } from "@/components/features/admin-licenses";
import { data } from "@/lib/data";
import { t } from "@/i18n";

export const metadata: Metadata = { title: "ผู้ดูแล · ไลเซนส์" };

export default async function AdminLicensesPage() {
  const [licenses, plans] = await Promise.all([data.listAllLicenses(), data.listAllPlans()]);
  return (<><DemoBanner>{t.demo.bannerAdmin} ระบบไลเซนส์จริงใน Supabase ไม่ถูกแตะต้อง</DemoBanner><PageHeading crumbs={[{ label: "ผู้ดูแล", href: "/admin" }, { label: "ไลเซนส์" }]} title="จัดการไลเซนส์" description="ค้นหา ตรวจสอบสถานะ และจำลองการออก เพิกถอน รีเซ็ต หรือขยายอายุไลเซนส์" /><AdminLicenses licenses={licenses} plans={plans} /></>);
}
