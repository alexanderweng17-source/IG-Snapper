import type { Metadata } from "next";
import { PreviewSiteFrame } from "@/components/features/preview-site-frame";

export const metadata: Metadata = { title: "คำถามที่พบบ่อย" };

export default function FaqPage() {
  return <PreviewSiteFrame page="faq" />;
}
