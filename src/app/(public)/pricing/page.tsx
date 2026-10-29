import type { Metadata } from "next";
import { PreviewSiteFrame } from "@/components/features/preview-site-frame";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ราคา" };

export default function PricingPage() {
  return <PreviewSiteFrame page="pricing" />;
}
