import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container-page py-24">
        <EmptyState icon={Compass} title="ไม่พบหน้าที่คุณต้องการ" description="หน้านี้อาจถูกย้ายหรือไม่มีอยู่ ลองกลับไปที่หน้าแรกหรือดูแพ็กเกจ"
          action={<div className="flex gap-2"><ButtonLink href="/">กลับหน้าแรก</ButtonLink><ButtonLink href="/pricing" variant="secondary">ดูแพ็กเกจ</ButtonLink></div>} />
      </main>
    </>
  );
}
