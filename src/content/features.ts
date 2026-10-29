import { Camera, GitCompareArrows, UserMinus, UserCog, FileDown, HardDrive, Languages } from "lucide-react";

/** ONLY features confirmed to exist in extension v2.3.1 (UI strings / code). */
export const features = [
  { icon: Camera, title: "บันทึกสแนปช็อต", body: "เก็บรายชื่อผู้ติดตามและรายชื่อที่คุณติดตาม ณ เวลาหนึ่งไว้เป็นข้อมูลอ้างอิง" },
  { icon: GitCompareArrows, title: "เทียบกับครั้งก่อน", body: "ดูประวัติการสแกนและการเปลี่ยนแปลงตั้งแต่สแนปช็อตครั้งก่อน เช่น ใครเลิกติดตามคุณ" },
  { icon: UserMinus, title: "หาคนที่ไม่ติดตามกลับ", body: "แสดงบัญชีที่คุณติดตามอยู่ แต่เขาไม่ได้ติดตามคุณ พร้อมช่องค้นหา" },
  { icon: UserCog, title: "จัดการรายชื่อที่ติดตาม", body: "เลิกติดตามจากในหน้าจอเดียว โดยระบบจะตรวจสอบกับ Instagram ก่อนอัปเดตหน้าจอ" },
  { icon: FileDown, title: "ส่งออกข้อมูล", body: "ส่งออกรายชื่อเป็นไฟล์ CSV หรือ JSON เพื่อเก็บสำรองหรือใช้งานต่อ" },
  { icon: HardDrive, title: "ข้อมูลอยู่ในเบราว์เซอร์ของคุณ", body: "สแนปช็อตและประวัติถูกบันทึกในเบราว์เซอร์ของคุณ ไม่ได้อัปโหลดไปยังเซิร์ฟเวอร์ของเรา" },
  { icon: Languages, title: "หน้าจอภาษาไทยและอังกฤษ", body: "ตัวส่วนขยายสลับภาษาไทย/อังกฤษได้" },
];
