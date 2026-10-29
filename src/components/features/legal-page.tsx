import { PageHeading } from "@/components/ui/page-heading";
import { DemoBanner } from "@/components/ui/demo-banner";
import { legal } from "@/content/legal";

export function LegalPage({ doc }: { doc: keyof typeof legal }) {
  const d = legal[doc];
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <PageHeading crumbs={[{ label: "หน้าแรก", href: "/" }, { label: "นโยบาย" }, { label: d.title }]} title={d.title} description={d.updated} />
      <DemoBanner>ฉบับร่าง: ข้อความด้านล่างเป็นตัวอย่างโครงสร้างเท่านั้น ต้องได้รับการเขียนและตรวจสอบโดยเจ้าของธุรกิจและผู้เชี่ยวชาญทางกฎหมายก่อนใช้งานจริง</DemoBanner>
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
