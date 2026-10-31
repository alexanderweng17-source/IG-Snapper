/**
 * Business facts the site displays. Everything marked TODO must be confirmed by the owner.
 * Facts about the extension were read from the v2.3.2 customer package
 * (manifest.json, background.js, UI strings).
 */
export const product = {
  name: "IG Snapper",
  version: "2.3.2", // from manifest.json
  packageName: "IG-Snapper-v2.3.2-customer.zip",
  // Chrome ZIP downloads are delivered by an authenticated server route. The iOS update script is public for auto-update.
  downloadUrl: "/api/downloads/chrome",
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
  { name: "Google Chrome บนคอมพิวเตอร์", note: String.fromCodePoint(3626,3619,3657,3634,3591,3649,3614,3655,3585,3648,3585,3592,3649,3621,3657,3623,32,3649,3605,3656,3618,3633,3591,3652,3617,3656,3652,3604,3657,3607,3604,3626,3629,3610,3605,3636,3604,3605,3633,3657,3591,3610,3609,32,67,104,114,111,109,101,32,3592,3619,3636,3591), status: "untested" }, // TODO: confirm tested Chrome versions
  { name: "Safari บน iPhone / iPad", note: String.fromCodePoint(3626,3619,3657,3634,3591,32,85,115,101,114,115,99,114,105,112,116,32,3649,3621,3657,3623,32,3649,3605,3656,3618,3633,3591,3652,3617,3656,3652,3604,3657,3607,3604,3626,3629,3610,3605,3636,3604,3605,3633,3657,3591,3610,3609,32,105,80,104,111,110,101,47,105,80,97,100,32,3592,3619,3636,3591), status: "untested" },
  { name: "Microsoft Edge, Brave และเบราว์เซอร์ Chromium อื่น ๆ", note: "โครงสร้างเดียวกับ Chrome แต่ยังไม่ได้ยืนยันการทดสอบ", status: "untested" },
  { name: "Firefox, Android และ Safari บน Mac", note: "ยังไม่รองรับในเวอร์ชันนี้ ยังไม่มีกำหนดการ", status: "unsupported" },
];
