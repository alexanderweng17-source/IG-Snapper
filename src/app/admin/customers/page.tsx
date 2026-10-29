import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { AdminCustomers } from "@/components/features/admin-customers";
import { AdminDataWarning } from "@/components/features/admin-data-warning";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ผู้ดูแล · ลูกค้า" };

export default async function AdminCustomersPage() {
  try {
    const customers = await data.listCustomers();
    return <><PageHeading crumbs={[{ label: "ผู้ดูแล", href: "/admin" }, { label: "ลูกค้า" }]} title="จัดการลูกค้า" description="รายชื่อลูกค้าจาก Supabase Auth และยอดซื้อจากคำสั่งซื้อจริง" /><AdminCustomers customers={customers} /></>;
  } catch (error) {
    console.error("Admin customers page failed", error);
    return <><PageHeading crumbs={[{ label: "ผู้ดูแล", href: "/admin" }, { label: "ลูกค้า" }]} title="จัดการลูกค้า" /><AdminDataWarning /></>;
  }
}