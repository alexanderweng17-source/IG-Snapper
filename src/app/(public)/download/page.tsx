import type { Metadata } from "next";
import { Download, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { CompatList } from "@/components/features/compat-list";
import { product } from "@/content/site";

export const metadata: Metadata = { title: "ดาวน์โหลดและติดตั้ง" };

const install = [
  ["ดาวน์โหลดและแตกไฟล์", `ดาวน์โหลดไฟล์ ${product.packageName} แล้วแตกไฟล์ไปไว้ในโฟลเดอร์ถาวร (อย่าลบโฟลเดอร์นี้หลังติดตั้ง เพราะ Chrome ต้องใช้ไฟล์จากโฟลเดอร์นี้)`],
  ["เปิดหน้าส่วนขยายของ Chrome", "พิมพ์ chrome://extensions ในแถบที่อยู่ แล้วเปิดสวิตช์ “โหมดนักพัฒนา” (Developer mode) มุมขวาบน"],
  ["โหลดส่วนขยาย", "กด “โหลดส่วนขยายที่ไม่ได้แพ็ก” (Load unpacked) แล้วเลือกโฟลเดอร์ที่แตกไฟล์ไว้"],
  ["ปักหมุดไอคอน", "กดไอคอนจิ๊กซอว์บนแถบเครื่องมือ แล้วปักหมุด IG Snapper เพื่อเข้าถึงได้ง่าย"],
  ["เปิดและกรอกคีย์", "ล็อกอิน Instagram ในเบราว์เซอร์ คลิกไอคอน IG Snapper แล้วกรอกคีย์ที่ได้จากหน้า “ไลเซนส์ของฉัน”"],
];

export default function DownloadPage() {
  const ready = !!product.downloadUrl;
  return (
    <div className="container-page max-w-4xl py-12 sm:py-16">
      <PageHeading crumbs={[{ label: "หน้าแรก", href: "/" }, { label: "ดาวน์โหลด" }]} title="ดาวน์โหลดและติดตั้ง" description="ติดตั้งบน Chrome ในคอมพิวเตอร์ ใช้เวลาไม่กี่นาที" />

      <Card className="mb-10">
        <CardBody className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">IG Snapper เวอร์ชัน {product.version}</h2><Badge tone="accent">เวอร์ชันล่าสุด</Badge></div>
            <p className="mt-1 font-mono text-sm text-muted">{product.packageName}</p>
            <div className="mt-3 flex flex-wrap gap-2"><Badge>Chrome (คอมพิวเตอร์)</Badge><Badge>Manifest V3</Badge></div>
          </div>
          {ready ? (
            <a href={product.downloadUrl} className="inline-flex h-12 items-center gap-2 rounded-md bg-accent px-6 font-medium text-accent-ink hover:bg-[rgb(163_146_255)]"><Download className="size-4" aria-hidden />ดาวน์โหลด</a>
          ) : (
            <Button size="lg" disabled><Download className="size-4" aria-hidden />ดาวน์โหลด (ยังไม่เปิดให้บริการ)</Button>
          )}
        </CardBody>
        {!ready && (
          <p className="flex items-start gap-2 border-t border-line/10 px-5 py-3 text-sm text-muted"><Info className="mt-0.5 size-4 shrink-0" aria-hidden />ต้นแบบนี้ยังไม่มีไฟล์ให้ดาวน์โหลด ลิงก์จะเปิดใช้งานเมื่อเชื่อมต่อระบบจริง (ตั้งค่าที่ <code className="font-mono">content/site.ts</code>)</p>
        )}
      </Card>

      <h2 className="text-xl font-semibold">ขั้นตอนการติดตั้ง</h2>
      <ol className="mt-5 space-y-4">
        {install.map(([title, body], i) => (
          <li key={title} className="flex gap-4 rounded-lg border border-line/10 bg-surface p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent">{i + 1}</span>
            <div><h3 className="font-medium">{title}</h3><p className="mt-0.5 text-sm text-muted">{body}</p></div>
          </li>
        ))}
      </ol>

      <h2 className="mt-14 text-xl font-semibold">การอัปเดต</h2>
      <div className="prose-th mt-3">
        <p>ตอนนี้ <strong className="text-ink">ยังไม่มีการอัปเดตอัตโนมัติ</strong> เมื่อมีเวอร์ชันใหม่:</p>
        <ul><li>ดาวน์โหลดไฟล์เวอร์ชันใหม่และแทนที่ไฟล์ในโฟลเดอร์เดิม</li><li>เปิด chrome://extensions แล้วกดปุ่มโหลดซ้ำ (Reload) ที่การ์ด IG Snapper</li></ul>
      </div>

      <h2 className="mt-14 text-xl font-semibold">ความเข้ากันได้</h2>
      <div className="mt-4"><CompatList /></div>
    </div>
  );
}
