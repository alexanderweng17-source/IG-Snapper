import type { Metadata } from "next";
import { LegalPage } from "@/components/features/legal-page";

export const metadata: Metadata = { title: "ข้อกำหนดการใช้งาน (ฉบับร่าง)" };
export default function Page() { return <LegalPage doc="terms" />; }
