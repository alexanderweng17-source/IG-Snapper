import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { AdminLicenses } from "@/components/features/admin-licenses";
import { AdminDataWarning } from "@/components/features/admin-data-warning";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ผู้ดูแล · ไลเซนส์" };

export default async function AdminLicensesPage() {
  try {
    const licenses = await data.listAllLicenses();
    return <><PageHeading crumbs={[{ label: "ผู้ดูแล", href: "/admin" }, { label: "ไลเซนส์" }]} title="จัดการไลเซนส์" description="ค้นหา ตรวจสอบสถานะ ขยายอายุ เพิกถอน หรือรีเซ็ตการเปิดใช้งาน" /><AdminLicenses licenses={licenses} /></>;
  } catch (error) {
    console.error("Admin license page failed", error);
    return <><PageHeading crumbs={[{ label: "ผู้ดูแล", href: "/admin" }, { label: "ไลเซนส์" }]} title="จัดการไลเซนส์" /><AdminDataWarning /></>;
  }
}