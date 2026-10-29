/**
 * UI message dictionary (Thai). To add English later:
 *  1. copy this file to en.ts with the same shape (type `Messages` enforces it),
 *  2. add a locale switch in `i18n/index.ts` (cookie / route segment).
 * Long-form page copy lives in `src/content/*` and follows the same approach.
 */
export const th = {
  brand: "IG Snapper",
  nav: {
    home: "หน้าแรก", pricing: "ราคา", download: "ดาวน์โหลด", faq: "คำถามที่พบบ่อย",
    dashboard: "แดชบอร์ด", signIn: "เข้าสู่ระบบ", register: "สมัครสมาชิก", signOut: "ออกจากระบบ",
    openMenu: "เปิดเมนู", closeMenu: "ปิดเมนู", skip: "ข้ามไปยังเนื้อหาหลัก",
  },
  dash: {
    overview: "ภาพรวม", licenses: "ไลเซนส์ของฉัน", orders: "ประวัติการสั่งซื้อ", profile: "ตั้งค่าบัญชี", support: "ศูนย์ช่วยเหลือ",
  },
  admin: {
    overview: "ภาพรวม", orders: "คำสั่งซื้อ", licenses: "ไลเซนส์", products: "แพ็กเกจ", customers: "ลูกค้า",
  },
  licenseStatus: { active: "ใช้งานได้", expired: "หมดอายุ", revoked: "ถูกเพิกถอน", pending: "รอดำเนินการ" },
  paymentStatus: { paid: "ชำระแล้ว", pending: "รอชำระเงิน", failed: "ไม่สำเร็จ", refunded: "คืนเงินแล้ว", canceled: "ยกเลิก" },
  common: {
    viewPlans: "ดูแพ็กเกจ", howItWorks: "วิธีใช้งาน", buy: "ซื้อแพ็กเกจนี้", copy: "คัดลอก", copied: "คัดลอกแล้ว",
    reveal: "แสดงคีย์", hide: "ซ่อนคีย์", search: "ค้นหา", all: "ทั้งหมด", cancel: "ยกเลิก", confirm: "ยืนยัน",
    save: "บันทึก", close: "ปิด", back: "ย้อนกลับ", next: "ถัดไป", previous: "ก่อนหน้า", details: "ดูรายละเอียด",
    loading: "กำลังโหลด…", tryAgain: "ลองอีกครั้ง", demoData: "ข้อมูลตัวอย่าง", simulated: "จำลอง",
    days: "วัน", perDay: "ต่อวัน", noResults: "ไม่พบรายการที่ตรงกับการค้นหา",
  },
  demo: {
    bannerDashboard: "โหมดต้นแบบ: ข้อมูลทั้งหมดในหน้านี้เป็นข้อมูลตัวอย่าง ยังไม่ได้เชื่อมต่อระบบจริง",
    bannerAdmin: "ต้นแบบหน้าจอผู้ดูแลระบบ: ยังไม่มีการตรวจสอบสิทธิ์ และการกระทำทุกอย่างเป็นการจำลอง",
    actionSimulated: "การกระทำนี้เป็นการจำลอง ยังไม่มีข้อมูลถูกเปลี่ยนแปลงจริง",
  },
  disclaimer: "IG Snapper เป็นผลิตภัณฑ์อิสระ ไม่ได้เกี่ยวข้อง ได้รับการรับรอง หรือสนับสนุนโดย Instagram หรือ Meta Platforms, Inc.",
} as const;

export type Messages = typeof th;
