"use client";
import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, TextArea, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function SupportForm() {
  const toast = useToast();
  const [f, setF] = useState({ topic: "license", order: "", message: "" });
  const [err, setErr] = useState<{ message?: string }>({}); const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.message.trim().length < 10) { setErr({ message: "กรุณาอธิบายปัญหาอย่างน้อย 10 ตัวอักษร" }); return; }
    setErr({}); setLoading(true); await new Promise((r) => setTimeout(r, 700)); setLoading(false);
    toast("ยังไม่ได้ส่งข้อความจริง — ระบบรับเรื่องยังไม่เปิดให้บริการ", "info");
  }
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="flex items-start gap-2 rounded-md bg-warning/10 p-3 text-sm text-warning"><FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />ฟอร์มนี้เป็นเพียงหน้าจอตัวอย่าง ข้อความจะไม่ถูกส่งไปที่ใด จนกว่าจะเชื่อมต่อระบบรับเรื่อง</p>
      <SelectField label="หัวข้อ" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
        <option value="license">คีย์ไลเซนส์ / การเปิดใช้งาน</option><option value="payment">การชำระเงิน / คำสั่งซื้อ</option><option value="install">การติดตั้ง</option><option value="refund">การคืนเงิน</option><option value="other">อื่น ๆ</option>
      </SelectField>
      <TextField label="เลขที่คำสั่งซื้อ (ถ้ามี)" placeholder="IGS-2026-0000" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} />
      <TextArea label="รายละเอียด" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} error={err.message} hint="อย่าใส่รหัสผ่านหรือข้อมูลบัตรในข้อความ" />
      <Button type="submit" loading={loading}>ส่งข้อความ (ตัวอย่าง)</Button>
    </form>
  );
}
