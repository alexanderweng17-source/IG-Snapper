import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { OrdersTable } from "@/components/features/orders-table";
import { AdminDataWarning } from "@/components/features/admin-data-warning";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ผู้ดูแล · คำสั่งซื้อ" };

export default async function AdminOrders() {
  try {
    const orders = await data.listAllOrders();
    return <><PageHeading crumbs={[{ label: "ผู้ดูแล", href: "/admin" }, { label: "คำสั่งซื้อ" }]} title="จัดการคำสั่งซื้อ" description="ค้นหา เรียงลำดับ และตรวจสอบสถานะการชำระเงินจากฐานข้อมูล" /><OrdersTable orders={orders} admin /></>;
  } catch (error) {
    console.error("Admin orders page failed", error);
    return <><PageHeading crumbs={[{ label: "ผู้ดูแล", href: "/admin" }, { label: "คำสั่งซื้อ" }]} title="จัดการคำสั่งซื้อ" /><AdminDataWarning /></>;
  }
}