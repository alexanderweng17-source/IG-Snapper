import type { Metadata } from "next";
import { Hourglass } from "lucide-react";
import { CheckoutStatus, ButtonLink } from "@/components/features/checkout-status";
export const metadata: Metadata = { title: "รอการยืนยันการชำระเงิน" };

export default function PendingPage() {
  return (
    <CheckoutStatus icon={Hourglass} tone="warning" title="กำลังรอการยืนยันการชำระเงิน"
      actions={<><ButtonLink href="/dashboard/orders">ตรวจสอบสถานะคำสั่งซื้อ</ButtonLink><ButtonLink href="/dashboard/support" variant="secondary">ติดต่อฝ่ายช่วยเหลือ</ButtonLink></>}>
      <p>บางวิธีชำระเงิน เช่น PromptPay อาจใช้เวลาสักครู่กว่าจะได้รับการยืนยัน คุณไม่ต้องชำระซ้ำ</p>
      <p>เมื่อระบบหลังบ้านได้รับการยืนยัน สถานะคำสั่งซื้อจะเปลี่ยนเป็น “ชำระแล้ว” และคีย์จะปรากฏในบัญชีของคุณ หากผ่านไปนานผิดปกติ ให้ติดต่อเราพร้อมเลขที่คำสั่งซื้อ</p>
    </CheckoutStatus>
  );
}
