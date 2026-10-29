import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PreviewSiteFrame } from "@/components/features/preview-site-frame";
import { getStorePlan } from "@/lib/store/plans";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "สรุปคำสั่งซื้อ" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: slug } = await searchParams;
  if (!slug || !getStorePlan(slug)) redirect("/pricing");
  return <PreviewSiteFrame page="checkout" planSlug={slug} />;
}
