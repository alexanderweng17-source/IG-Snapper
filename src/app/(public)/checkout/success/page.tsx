import type { Metadata } from "next";
import { CheckoutSuccessClient } from "@/components/features/checkout-success-client";
export const metadata: Metadata = { title: "ตรวจสอบการชำระเงิน" };
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId = "" } = await searchParams;
  return <div className="container-page max-w-xl py-16 sm:py-24"><div className="rounded-xl border border-line/10 bg-surface p-6 text-center shadow-card sm:p-10"><CheckoutSuccessClient sessionId={sessionId} /></div></div>;
}
