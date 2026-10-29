"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatTHB } from "@/lib/utils";

type OrderInfo = { order_number: string; payment_status: string; plan_name: string; amount_satang: number; paid_at: string | null; license_key_hash: string | null };
export function CheckoutSuccessClient({ sessionId }: { sessionId: string }) {
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function check() {
      if (!sessionId) { setError("ไม่พบรหัสคำสั่งซื้อจาก Stripe"); return; }
      try {
        const response = await fetch(`/api/orders/status?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error === "not_found" ? "ไม่พบคำสั่งซื้อนี้ในบัญชีของคุณ" : "ไม่สามารถตรวจสอบสถานะได้ กรุณาเข้าสู่ระบบอีกครั้ง");
        if (cancelled) return;
        setOrder(body.order as OrderInfo); setError("");
        if (body.order?.payment_status === "pending" && attempt < 10) {
          timer = setTimeout(() => setAttempt((v) => v + 1), 2500);
        }
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : "ไม่สามารถตรวจสอบสถานะได้"); }
    }
    void check();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [sessionId, attempt]);

  if (error) return <div className="space-y-4 text-center"><ShieldAlert className="mx-auto size-10 text-warning" /><h1 className="text-xl font-semibold">ยังตรวจสอบคำสั่งซื้อไม่ได้</h1><p className="text-sm text-muted">{error}</p><div className="flex flex-wrap justify-center gap-2"><ButtonLink href="/dashboard/orders">ประวัติการสั่งซื้อ</ButtonLink><ButtonLink href="/pricing" variant="secondary">กลับไปหน้าแพ็กเกจ</ButtonLink></div></div>;
  if (!order) return <div className="space-y-4 text-center"><Clock3 className="mx-auto size-10 animate-pulse text-accent" /><h1 className="text-xl font-semibold">กำลังตรวจสอบคำสั่งซื้อ…</h1><p className="text-sm text-muted">ระบบกำลังสอบถามสถานะล่าสุดจากหลังบ้าน ไม่ใช้แค่การกลับจาก Stripe เป็นหลักฐานการชำระเงิน</p></div>;
  if (order.payment_status === "paid" && order.license_key_hash) return <div className="space-y-4 text-center"><CheckCircle2 className="mx-auto size-12 text-success" /><h1 className="text-xl font-semibold">ชำระเงินสำเร็จ</h1><p className="text-sm text-muted">คำสั่งซื้อ {order.order_number} · ไลเซนส์ {order.plan_name}</p><p className="text-sm">ยอดชำระ {formatTHB(order.amount_satang)}</p><Badge tone="success">ออก License Key แล้ว</Badge><div className="flex flex-wrap justify-center gap-2 pt-2"><ButtonLink href="/dashboard/licenses">ดู License Key ของฉัน</ButtonLink><ButtonLink href="/dashboard/orders" variant="secondary">ประวัติการสั่งซื้อ</ButtonLink></div></div>;
  return <div className="space-y-4 text-center"><Clock3 className="mx-auto size-10 text-warning" /><h1 className="text-xl font-semibold">ได้รับคำสั่งซื้อแล้ว กำลังรอการยืนยัน</h1><p className="text-sm text-muted">{order.order_number} · {order.plan_name} · {formatTHB(order.amount_satang)}</p><Badge tone="warning">รอตรวจสอบการชำระเงิน</Badge><p className="text-sm text-muted">วิธี PromptPay อาจต้องใช้เวลาสักครู่ ระบบจะออกคีย์หลังได้รับการยืนยันจาก Stripe เท่านั้น</p><div className="flex flex-wrap justify-center gap-2"><ButtonLink href="/dashboard/orders">ดูประวัติการสั่งซื้อ</ButtonLink><ButtonLink href="/dashboard/licenses" variant="secondary">ไลเซนส์ของฉัน</ButtonLink></div></div>;
}
