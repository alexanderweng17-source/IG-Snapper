"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight, Camera, Check, Clock3, Database, Download, FileText,
  History, LockKeyhole, ShieldCheck, Sparkles, TrendingDown, Users,
} from "lucide-react";
import type { Plan } from "@/lib/data/types";
import { formatTHB } from "@/lib/utils";
import styles from "./home-preview.module.css";

type PreviewTab = "changes" | "history" | "export";

const previewTabs: { id: PreviewTab; title: string; description: string }[] = [
  { id: "changes", title: "เปรียบเทียบการเปลี่ยนแปลง", description: "ดูความแตกต่างระหว่างสแนปช็อตที่บันทึกไว้ โดยใช้ข้อมูลตัวอย่าง" },
  { id: "history", title: "ประวัติสแกน", description: "ย้อนดูสแนปช็อตแต่ละครั้งและการเปลี่ยนแปลงที่พบ" },
  { id: "export", title: "ส่งออกและสำรองข้อมูล", description: "ดูตัวอย่างรายการไฟล์ที่สามารถส่งออกได้ในเวอร์ชันที่รองรับ" },
];

const sampleUsers = ["sample.user_01", "demo.account", "example_shop", "test.name_22"];
const steps = [
  ["เลือกแพ็กเกจ", "เลือกช่วงเวลาใช้งานที่เหมาะกับคุณ"],
  ["เข้าสู่ระบบ", "ใช้บัญชีของคุณเพื่อดูคำสั่งซื้อและ License"],
  ["ชำระเงินผ่าน Stripe", "ไปยังหน้าชำระเงินที่ปลอดภัยของ Stripe"],
  ["รับคีย์ในบัญชี", "คีย์จะแสดงหลังระบบยืนยันยอดชำระเงินจริง"],
  ["ติดตั้งและเปิดใช้งาน", "กรอก License ใน Extension บนคอมพิวเตอร์"],
];

export function HomePreview({ plans }: { plans: Plan[] }) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("changes");
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sortedPlans = [...plans].sort((a, b) => a.durationDays - b.durationDays);
  const minPrice = sortedPlans.length ? Math.min(...sortedPlans.map((p) => p.priceSatang)) : null;
  const minPlan = sortedPlans.find((p) => p.priceSatang === minPrice);

  return (
    <div className={styles.page}>
      <div className={styles.aurora} aria-hidden="true"><i /><i /><i /></div>

      <section className={`${styles.hero} ${styles.heroColumns}`} aria-labelledby="hero-heading">
        <div className={styles.heroCopy}>
          <span className={styles.badge}><ShieldCheck size={14} aria-hidden="true" /> ส่วนขยายสำหรับ Chrome บนคอมพิวเตอร์ · เวอร์ชัน 2.3.1</span>
          <h1 id="hero-heading" className={styles.headline}>
            เห็นการเปลี่ยนแปลงของผู้ติดตาม <span className={styles.gradientText}>ข้อมูลสแนปช็อตอยู่ในเบราว์เซอร์ของคุณ</span>
          </h1>
          <p className={styles.heroDescription}>
            บันทึกสแนปช็อตรายชื่อผู้ติดตาม Instagram เปรียบเทียบการเปลี่ยนแปลงระหว่างครั้ง และส่งออกข้อมูลในหน้าจอเดียว ซื้อ License ตามระยะเวลาที่เลือก โดยไม่ต่ออายุอัตโนมัติ
          </p>
          <div className={styles.heroActions}>
            <Link className={`${styles.button} ${styles.primaryButton}`} href="/pricing">ดูแพ็กเกจ{minPrice !== null ? ` เริ่ม ${formatTHB(minPrice)}` : ""} <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link className={`${styles.button} ${styles.secondaryButton}`} href="#how-it-works">วิธีใช้งาน</Link>
          </div>
          <div className={styles.trustLine}>
            <span><Check size={15} aria-hidden="true" /> ไม่มี Wallet หรือการเติมเงิน</span>
            <span><LockKeyhole size={15} aria-hidden="true" /> ข้อมูลสแนปช็อตอยู่ในเบราว์เซอร์*</span>
          </div>
          <p className={styles.disclaimer}>* ขึ้นอยู่กับวิธีใช้งานและข้อมูลที่ Extension ประมวลผล โปรดอ่านนโยบายความเป็นส่วนตัวก่อนใช้งาน</p>
        </div>

        <div className={styles.stage} aria-label="ภาพจำลองหน้าจอ IG Snapper">
          <div className={`${styles.floatBadge} ${styles.floatTop}`}><TrendingDown size={15} aria-hidden="true" /> พบความเปลี่ยนแปลง <b>−3</b></div>
          <div className={`${styles.floatBadge} ${styles.floatBottom}`}><Check size={15} aria-hidden="true" /> สแนปช็อตบันทึกแล้ว</div>
          <MockWindow tab="changes" compact />
          <p className={styles.mockCaption}>ภาพประกอบหน้าตาโปรแกรมโดยใช้บัญชีและข้อมูลสมมติ ไม่ใช่ภาพหน้าจอการทำงานจริง</p>
        </div>
      </section>

      <div className={styles.marquee} aria-label="คุณสมบัติเด่น">
        <div className={styles.marqueeTrack}>
          {["บันทึกสแนปช็อต", "เปรียบเทียบกับครั้งก่อน", "ประวัติการสแกน", "ส่งออกข้อมูล", "ข้อมูลอยู่ในเบราว์เซอร์", "ซื้อ License ครั้งเดียว", "ดูสถานะ License", "หน้าจอภาษาไทย", "บันทึกสแนปช็อต", "เปรียบเทียบกับครั้งก่อน", "ประวัติการสแกน", "ส่งออกข้อมูล", "ข้อมูลอยู่ในเบราว์เซอร์", "ซื้อ License ครั้งเดียว", "ดูสถานะ License", "หน้าจอภาษาไทย"].map((item, i) => <span key={`${item}-${i}`}>{item}</span>)}
        </div>
      </div>

      <section className={styles.section} aria-labelledby="features-heading">
        <div className={`${styles.split} ${styles.featureSplit}`}>
          <div>
            <h2 id="features-heading" className={styles.sectionTitle}>หน้าจอเดียว ครบทุกอย่างที่ต้องดู</h2>
            <p className={styles.muted}>เลือกหัวข้อเพื่อดูภาพจำลองการใช้งาน โดยใช้ข้อมูลตัวอย่างเท่านั้น</p>
            <div className={styles.featureTabs} role="tablist" aria-label="ตัวอย่างฟีเจอร์">
              {previewTabs.map((tab) => (
                <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={`${styles.featureTab} ${activeTab === tab.id ? styles.featureTabActive : ""}`} onClick={() => setActiveTab(tab.id)}>
                  <b>{tab.title}</b><small>{tab.description}</small>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.featurePreview}>
            <MockWindow tab={activeTab} />
          </div>
        </div>
      </section>

      <section className={styles.sectionTight} aria-labelledby="why-heading">
        <h2 id="why-heading" className={styles.sectionTitle}>ทำไมต้อง IG Snapper</h2>
        <div className={styles.reasonGrid}>
          <Reason icon={<Database size={21} />} title="เข้าใจเรื่องข้อมูล" body="แสดงสถานะและคำอธิบายเรื่องการประมวลผลข้อมูลอย่างชัดเจน ตรวจสอบนโยบายความเป็นส่วนตัวได้ก่อนซื้อ" />
          <Reason icon={<Clock3 size={21} />} title="ซื้อครั้งเดียวตามระยะเวลา" body="เลือกแพ็กเกจตามช่วงเวลาที่ต้องการ ไม่มี Wallet หรือการเติมเงิน และไม่มีการต่ออายุอัตโนมัติในแพ็กเกจแบบซื้อครั้งเดียว" />
          <Reason icon={<ShieldCheck size={21} />} title="ตรวจสอบ License ได้" body="ดูคีย์ สถานะ และวันหมดอายุจากบัญชีลูกค้า โดยระบบจริงจะออกคีย์หลังยืนยันการชำระเงินแล้วเท่านั้น" />
        </div>
      </section>

      <section id="how-it-works" className={styles.section} aria-labelledby="steps-heading">
        <h2 id="steps-heading" className={styles.sectionTitle}>ซื้อและเริ่มใช้งานอย่างไร</h2>
        <ol className={styles.steps}>
          {steps.map(([title, description], index) => <li key={title} className={styles.step}><span className={styles.stepNumber}>{index + 1}</span><h3>{title}</h3><p>{description}</p></li>)}
        </ol>
      </section>

      <section id="landing-pricing" className={styles.sectionTight} aria-labelledby="plans-heading">
        <div className={styles.sectionHeadingRow}>
          <div><h2 id="plans-heading" className={styles.sectionTitle}>เลือกระยะเวลาที่เหมาะกับคุณ</h2><p className={styles.muted}>ทุกแพ็กเกจใช้ฟีเจอร์เดียวกัน ต่างกันที่ระยะเวลาและราคา</p></div>
          <Link href="/pricing" className={styles.textLink}>เปรียบเทียบแพ็กเกจทั้งหมด <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <p className={styles.priceNotice}>ราคาที่แสดงเป็นข้อมูลตัวอย่างจากโปรเจกต์ปัจจุบัน ยังไม่ใช่ราคาขายจริง</p>
        <div className={styles.planGrid}>
          {sortedPlans.map((plan) => {
            const perDay = plan.priceSatang / Math.max(plan.durationDays, 1);
            const bestValue = plan.durationDays === Math.max(...sortedPlans.map((p) => p.durationDays));
            return (
              <article key={plan.id} className={`${styles.planCard} ${bestValue ? styles.planHighlight : ""}`}>
                {bestValue && <span className={styles.planTag}><Sparkles size={13} aria-hidden="true" /> ระยะยาว</span>}
                <h3>ไลเซนส์ {plan.name}</h3>
                <p className={styles.planTagline}>{plan.tagline}</p>
                <div className={styles.price}>{formatTHB(plan.priceSatang)}<span> / {plan.durationDays} วัน</span></div>
                <p className={styles.perDay}>ประมาณ {formatTHB(Math.round(perDay))} ต่อวัน{plan.isPlaceholderPrice ? " · ราคาตัวอย่าง" : ""}</p>
                {bestValue && <span className={styles.savings}>ราคาต่อวันต่ำเมื่อเทียบกับแพ็กเกจสั้น</span>}
                <ul className={styles.planIncludes}>
                  <li><Check size={15} aria-hidden="true" /> ใช้ได้ตามระยะเวลาที่เลือก</li>
                  <li><Check size={15} aria-hidden="true" /> ดู License ในบัญชีของคุณ</li>
                  <li><Check size={15} aria-hidden="true" /> ซื้อครั้งเดียว ไม่ต่ออายุอัตโนมัติ</li>
                </ul>
                <Link className={`${styles.button} ${bestValue ? styles.primaryButton : styles.secondaryButton} ${styles.planButton}`} href={`/checkout?plan=${encodeURIComponent(plan.slug)}`}>เลือกแพ็กเกจนี้</Link>
              </article>
            );
          })}
        </div>
        <div className={styles.valuePanel}>
          <h3>เทียบราคาเฉลี่ยต่อวัน</h3><p className={styles.faint}>คำนวณจากราคาตัวอย่างในโปรเจกต์</p>
          <div className={styles.barList}>{sortedPlans.map((plan) => {
            const value = plan.priceSatang / 100 / Math.max(plan.durationDays, 1);
            const max = Math.max(...sortedPlans.map((p) => p.priceSatang / 100 / Math.max(p.durationDays, 1)), 1);
            return <div key={plan.id} className={styles.barRow}><span>{plan.durationDays} วัน</span><div className={styles.barTrack}><span style={{ width: `${Math.max(5, value / max * 100)}%` }} /></div><b>{formatTHB(Math.round(plan.priceSatang / Math.max(plan.durationDays, 1)))}/วัน</b></div>;
          })}</div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.ctaSection}`}>
        <div className={styles.ctaCard}>
          <span className={styles.ctaIcon}><Sparkles size={20} aria-hidden="true" /></span>
          <h2 className={styles.sectionTitle}>เริ่มต้นใช้งาน IG Snapper</h2>
          <p className={styles.muted}>ตรวจสอบแพ็กเกจและความเข้ากันได้ก่อนซื้อ แล้วจัดการ License จากบัญชีของคุณได้ในที่เดียว</p>
          <Link className={`${styles.button} ${styles.primaryButton}`} href="/pricing">เลือกแพ็กเกจ <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>

      <div className={`${styles.stickyBuy} ${stickyVisible ? styles.stickyBuyVisible : ""}`} aria-hidden={!stickyVisible}>
        <span>ดูแพ็กเกจ License</span><Link href="/pricing" tabIndex={stickyVisible ? 0 : -1} className={`${styles.button} ${styles.primaryButton}`}>เลือกแพ็กเกจ</Link>
      </div>
    </div>
  );
}

function Reason({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <article className={styles.reasonCard}><span className={styles.reasonIcon}>{icon}</span><h3>{title}</h3><p>{body}</p></article>;
}

function MockWindow({ tab, compact = false }: { tab: PreviewTab | "main"; compact?: boolean }) {
  let rows: { label: string; value: string; kind: "negative" | "positive" | "neutral" }[];
  let subtitle: string;
  if (tab === "history") {
    subtitle = "ประวัติสแนปช็อต · ข้อมูลตัวอย่าง";
    rows = [
      { label: "วันนี้ · 1,281 ผู้ติดตาม", value: "−3", kind: "negative" },
      { label: "5 วันก่อน · 1,284 ผู้ติดตาม", value: "+12", kind: "positive" },
      { label: "12 วันก่อน · 1,272 ผู้ติดตาม", value: "−5", kind: "negative" },
      { label: "20 วันก่อน · 1,277 ผู้ติดตาม", value: "+2", kind: "positive" },
    ];
  } else if (tab === "export") {
    subtitle = "ส่งออกและสำรองข้อมูล";
    rows = [
      { label: "followers_snapshot.csv", value: "CSV", kind: "neutral" },
      { label: "following_snapshot.json", value: "JSON", kind: "neutral" },
      { label: "snapshot_history.csv", value: "CSV", kind: "neutral" },
    ];
  } else {
    subtitle = compact ? "กำลังเปรียบเทียบข้อมูลที่บันทึกไว้…" : "การเปลี่ยนแปลงจากสแนปช็อตล่าสุด · ข้อมูลตัวอย่าง";
    rows = sampleUsers.map((label, i) => ({ label: `@${label}`, value: ["−3", "เปลี่ยนแปลง", "ข้อมูลใหม่", "ไม่พบความเปลี่ยนแปลง"][i], kind: (["negative", "positive", "positive", "neutral"] as const)[i] }));
  }
  return (
    <div className={styles.mockWindow}>
      <div className={styles.browserBar}><i /><i /><i /><span>instagram.com · IG Snapper</span></div>
      <div className={styles.mockPanel}>
        <div className={styles.mockHeader}><span className={styles.mockLogo}><Camera size={14} aria-hidden="true" /></span><b>IG Snapper</b><span className={styles.activePill}><i /> ตัวอย่าง</span></div>
        <div className={styles.metrics}>
          <div><small>ผู้ติดตาม</small><b>1,281</b></div><div><small>กำลังติดตาม</small><b>1,102</b></div><div><small>การเปลี่ยนแปลง</small><b className={styles.metricAccent}>−3</b></div>
        </div>
        <div className={styles.progress}><i /></div><p className={styles.mockSubtitle}>{subtitle}</p>
        <div className={styles.mockTabs}><span className={tab === "changes" || tab === "main" ? styles.mockTabActive : ""}>การเปลี่ยนแปลง</span><span className={tab === "history" ? styles.mockTabActive : ""}>ประวัติ</span><span className={tab === "export" ? styles.mockTabActive : ""}>ส่งออก</span></div>
        <div className={styles.mockRows}>
          {rows.map((row, i) => <div className={styles.mockRow} key={`${tab}-${row.label}`} style={{ animationDelay: `${i * 70}ms` }}><span className={styles.avatar}>{row.label.replace("@", "").slice(0, 1).toUpperCase()}</span><span className={styles.rowLabel}>{row.label}</span><span className={`${styles.rowStatus} ${row.kind === "negative" ? styles.negative : row.kind === "positive" ? styles.positive : styles.neutral}`}>{row.value}</span></div>)}
        </div>
        <div className={styles.mockActions}><span><Download size={13} aria-hidden="true" /> ส่งออกข้อมูล</span><span><FileText size={13} aria-hidden="true" /> รายงานตัวอย่าง</span><span><History size={13} aria-hidden="true" /> ประวัติ</span></div>
        <p className={styles.sampleNote}><Users size={12} aria-hidden="true" /> ใช้ข้อมูลสมมติสำหรับภาพประกอบเท่านั้น</p>
      </div>
    </div>
  );
}
