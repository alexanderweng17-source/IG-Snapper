import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { DemoBanner } from "@/components/ui/demo-banner";
import { OrdersTable } from "@/components/features/orders-table";
import { data } from "@/lib/data";
import { t } from "@/i18n";

export const metadata: Metadata = { title: "ผู้ดูแล · คำสั่งซื้อ" };

export default async function AdminOrders() {
  const orders = await data.listAllOrders();
  return (<><DemoBanner>{t.demo.bannerAdmin}</DemoBanner><PageHeading crumbs={[{ label: "ผู้ดูแล", href: "/admin" }, { label: "คำสั่งซื้อ" }]} title="จัดการคำสั่งซื้อ" /><OrdersTable orders={orders} admin /></>);
}
