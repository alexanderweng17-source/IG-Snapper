import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { OrdersTable } from "@/components/features/orders-table";
import { data } from "@/lib/data";

export const metadata: Metadata = { title: "ประวัติการสั่งซื้อ" };

export default async function OrdersPage() {
  const orders = await data.listMyOrders();
  return (
    <>
      <PageHeading crumbs={[{ label: "แดชบอร์ด", href: "/dashboard" }, { label: "ประวัติการสั่งซื้อ" }]} title="ประวัติการสั่งซื้อ" description="สถานะ “ชำระแล้ว” มาจากการยืนยันของระบบหลังบ้านเท่านั้น" />
      <OrdersTable orders={orders} />
    </>
  );
}
