import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { AdminProducts } from "@/components/features/admin-products";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ผู้ดูแล · แพ็กเกจ" };

export default async function AdminProductsPage() {
  const plans = await data.listAllPlans();
  return <><PageHeading crumbs={[{ label: "ผู้ดูแล", href: "/admin" }, { label: "แพ็กเกจ" }]} title="แพ็กเกจและสถานะร้านค้า" description="ตรวจสอบราคาและสถานะการรับชำระเงินที่ตั้งไว้ใน deployment" /><AdminProducts plans={plans} checkoutEnabled={process.env.STORE_CHECKOUT_ENABLED === "true"} /></>;
}