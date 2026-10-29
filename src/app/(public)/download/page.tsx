import type { Metadata } from "next";
import { PreviewSiteFrame } from "@/components/features/preview-site-frame";

export const metadata: Metadata = { title: "ดาวน์โหลดและติดตั้ง" };

export default function DownloadPage() {
  return <PreviewSiteFrame page="download" />;
}
