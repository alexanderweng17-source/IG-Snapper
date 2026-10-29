import { PageHeading } from "@/components/ui/page-heading";
import { DemoBanner } from "@/components/ui/demo-banner";
import { legal } from "@/content/legal";

export function LegalPage({ doc }: { doc: keyof typeof legal }) {
  const d = legal[doc];
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <PageHeading crumbs={[{ label: "หน้าแรก", href: "/" }, { label: "นโยบาย" }, { label: d.title }]} title={d.title} description={d.updated} />
      <DemoBanner>ข้อเสนอร่างนโยบายสำหรับตรวจทานก่อนประกาศใช้ โปรดยืนยันข้อมูลผู้ขาย ช่องทางติดต่อ และรายละเอียดการทำงานจริงของส่วนขยายให้ตรงกับข้อความนี้ก่อนเผยแพร่ฉบับมีผล</DemoBanner>
      <div className="prose-th max-w-none">
        {d.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.body.map((p, i) => <p key={i}>{p}</p>)}
            {s.list && <ul>{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
          </section>
        ))}
      </div>
    </div>
  );
}
