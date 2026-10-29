import type { Metadata } from "next";
import { PreviewSiteFrame } from "@/components/features/preview-site-frame";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "IG Snapper — ผู้ช่วยจัดการผู้ติดตาม Instagram" };

export default function HomePage() {
  return <PreviewSiteFrame page="home" />;
}
