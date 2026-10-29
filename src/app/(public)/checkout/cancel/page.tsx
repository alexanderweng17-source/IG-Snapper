import type { Metadata } from "next";
import { CircleSlash } from "lucide-react";
import { CheckoutStatus, ButtonLink } from "@/components/features/checkout-status";
export const metadata: Metadata = { title: "ยกเลิกการชำระเงิน" };

export default function CancelPage() {
  return (
    <CheckoutStatus icon={CircleSlash} tone="neutral" title="การชำระเงินยังไม่เสร็จสมบูรณ์"
      actions={<><ButtonLink href="/pricing">กลับไปเลือกแพ็กเกจ</ButtonLink><ButtonLink href="/dashboard/orders" variant="secondary">ดูประวัติการสั่งซื้อ</ButtonLink></>}>
      <p>คุณออกจากหน้าชำระเงินก่อนดำเนินการเสร็จ จึงยังไม่มีการออกคีย์ไลเซนส์</p>
      <p>หากคุณคิดว่าถูกเรียกเก็บเงินแล้ว โปรดตรวจสอบสถานะที่ประวัติการสั่งซื้อ หรือติดต่อฝ่ายช่วยเหลือพร้อมหลักฐานการชำระเงิน</p>
    </CheckoutStatus>
  );
}
