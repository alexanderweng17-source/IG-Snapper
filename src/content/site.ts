/**
 * Business facts the site displays. Everything marked TODO must be confirmed by the owner.
 * Facts about the extension were read from the v2.3.1 customer package
 * (manifest.json, background.js, UI strings).
 */
export const product = {
  name: "IG Snapper",
  version: "2.3.1", // from manifest.json
  packageName: "IG-Snapper-v2.3.1-customer.zip",
  // No public file is hosted in this prototype. Leave empty until a protected download exists.
  downloadUrl: "",
  /** Default limits from background.js comments: "1 account / 2 browsers, set per key". TODO confirm before selling. */
  defaultActivation: { accounts: 1, browsers: 2 },
  licenseRecheckHours: 6,
  offlineGraceHours: 24,
};

export const support = {
  // TODO: fill in real channels. Empty values render as "coming soon".
  email: "",
  line: "",
  discord: "",
  hours: "",
};

export type Compat = "supported" | "untested" | "unsupported";
export const compatibility: { name: string; note: string; status: Compat }[] = [
  { name: "Google Chrome บนคอมพิวเตอร์", note: "ส่วนขยายแบบ Manifest V3 (เวอร์ชัน 2.3.1)", status: "supported" }, // TODO: confirm tested Chrome versions
  { name: "Microsoft Edge, Brave และเบราว์เซอร์ Chromium อื่น ๆ", note: "โครงสร้างเดียวกับ Chrome แต่ยังไม่ได้ยืนยันการทดสอบ", status: "untested" },
  { name: "Firefox และ Safari", note: "ยังไม่รองรับในเวอร์ชันนี้ ยังไม่มีกำหนดการ", status: "unsupported" },
  { name: "เบราว์เซอร์บน Android และ iPhone", note: "ใช้ส่วนขยายไม่ได้ (เว็บไซต์นี้เปิดดูและซื้อบนมือถือได้ตามปกติ)", status: "unsupported" },
];
