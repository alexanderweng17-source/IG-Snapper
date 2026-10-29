"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CheckoutHandoff({ planSlug, enabled }: { planSlug: string; enabled: boolean }) {
  const router = useRouter(); const toast = useToast(); const [loading, setLoading] = useState(false);
  async function beginCheckout() {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/checkout?plan=${planSlug}`)}`);
        return;
      }
      if (!response.ok || typeof body.url !== "string") throw new Error(body.error || "เริ่มชำระเงินไม่สำเร็จ");
      window.location.assign(body.url);
    } catch (err) {
      toast(err instanceof Error ? err.message : "เริ่มชำระเงินไม่สำเร็จ", "error");
    } finally { setLoading(false); }
  }
  if (!enabled) return <div className="space-y-2">
    <Button size="lg" className="w-full" disabled><Lock className="size-4" aria-hidden />ยังไม่เปิดรับชำระเงินจริง</Button>
    <p className="text-xs leading-5 text-warning">ต้องกำหนดราคาขายจริงและเปิดระบบ Checkout ใน Environment Variables ก่อน จึงจะรับชำระเงินได้</p>
  </div>;
  return <div className="space-y-2">
    <Button size="lg" className="w-full" loading={loading} onClick={beginCheckout}><Lock className="size-4" aria-hidden />{loading ? "กำลังเปิดหน้าชำระเงิน…" : "ชำระเงินผ่าน Stripe"}</Button>
    <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck className="size-3.5" aria-hidden />คีย์จะออกหลังยืนยันการชำระเงินจาก Stripe เท่านั้น</p>
  </div>;
}
