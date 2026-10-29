import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: { default: "IG Snapper — เครื่องมือจัดการผู้ติดตาม Instagram", template: "%s · IG Snapper" },
  description: "ส่วนขยายเบราว์เซอร์สำหรับบันทึกสแนปช็อตผู้ติดตาม Instagram และดูว่าใครเลิกติดตามคุณ ซื้อไลเซนส์แบบชำระครั้งเดียว",
  robots: { index: false, follow: false }, // Keep non-indexed until legal copy and live checkout are reviewed.
};
export const viewport: Viewport = { themeColor: "#0a0c14", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Runtime-loaded; falls back to system Thai fonts if blocked. Self-host via next/font before launch if preferred. */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" />
      </head>
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
