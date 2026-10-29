import type { Metadata } from "next";
import { LegalPage } from "@/components/features/legal-page";

export const metadata: Metadata = { title: "นโยบายการคืนเงิน (ฉบับร่าง)" };
export default function Page() { return <LegalPage doc="refunds" />; }
