import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AdminDataWarning({ detail = "ระบบไม่สามารถอ่านข้อมูลจากฐานข้อมูลได้ในขณะนี้" }: { detail?: string }) {
  return (
    <Card className="mt-5 border-warning/25 bg-warning/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <div className="space-y-2">
          <h2 className="font-semibold">ข้อมูลหลังบ้านยังไม่พร้อม</h2>
          <p className="text-sm text-muted">{detail}</p>
          <p className="text-sm text-muted">
            ตรวจสอบ Environment Variables ของโปรเจกต์ ig-snapper ใน Vercel ว่ามี <code>SUPABASE_SECRET_KEY</code>
            หรือ <code>SUPABASE_SERVICE_ROLE_KEY</code> และ redeploy หลังบันทึกค่าแล้ว
          </p>
          <p className="text-xs text-faint">ข้อมูลลับต้องอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามตั้งชื่อตัวแปรขึ้นต้นด้วย NEXT_PUBLIC_</p>
        </div>
      </div>
    </Card>
  );
}
