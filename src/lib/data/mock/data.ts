// ───────────────────────────────────────────────────────────────────────────
// MOCK DATA — every value here is fictional sample data for the UI prototype.
// Keys use a visibly fake format and are NOT valid licenses.
// Dates are relative to a fixed "demo now" so the screens stay stable.
// ───────────────────────────────────────────────────────────────────────────
import type { ActivityItem, Customer, License, Order, Plan } from "../types";

export const DEMO_NOW = new Date("2026-10-29T09:00:00+07:00");
const d = (offsetDays: number) => new Date(DEMO_NOW.getTime() + offsetDays * 86_400_000).toISOString();

export const plans: Plan[] = [
  { id: "plan_30", slug: "30-days", name: "30 วัน", durationDays: 30, priceSatang: 19900, isPlaceholderPrice: true, visible: true, tagline: "ลองใช้งานระยะสั้น" },
  { id: "plan_90", slug: "90-days", name: "90 วัน", durationDays: 90, priceSatang: 49900, isPlaceholderPrice: true, visible: true, highlight: true, tagline: "เหมาะกับการใช้งานต่อเนื่อง" },
  { id: "plan_365", slug: "365-days", name: "365 วัน", durationDays: 365, priceSatang: 149000, isPlaceholderPrice: true, visible: true, tagline: "ราคาต่อวันต่ำที่สุด" },
];

export const licenses: License[] = [
  {
    id: "lic_1", planId: "plan_90", planName: "90 วัน", key: "DEMO-SAMPLE-0001-AAAA", status: "active",
    purchasedAt: d(-40), expiresAt: d(50), maxAccounts: 1, maxBrowsers: 2, orderId: "ord_1", customerId: "cus_1",
    activations: [
      { id: "act_1", browserLabel: "Chrome บน Windows (ตัวอย่าง)", accountHashPrefix: "a3f9…c21d", firstSeenAt: d(-39), lastSeenAt: d(0) },
      { id: "act_2", browserLabel: "Edge บน Windows (ตัวอย่าง)", accountHashPrefix: "a3f9…c21d", firstSeenAt: d(-12), lastSeenAt: d(-3) },
    ],
  },
  {
    id: "lic_2", planId: "plan_30", planName: "30 วัน", key: "DEMO-SAMPLE-0002-BBBB", status: "active",
    purchasedAt: d(-25), expiresAt: d(5), maxAccounts: 1, maxBrowsers: 2, orderId: "ord_2", customerId: "cus_1",
    activations: [{ id: "act_3", browserLabel: "Chrome บน macOS (ตัวอย่าง)", accountHashPrefix: "7be0…94aa", firstSeenAt: d(-24), lastSeenAt: d(-1) }],
  },
  { id: "lic_3", planId: "plan_30", planName: "30 วัน", key: "DEMO-SAMPLE-0003-CCCC", status: "expired", purchasedAt: d(-120), expiresAt: d(-90), maxAccounts: 1, maxBrowsers: 2, orderId: "ord_3", customerId: "cus_1", activations: [{ id: "act_4", browserLabel: "Chrome บน Windows (ตัวอย่าง)", accountHashPrefix: "a3f9…c21d", firstSeenAt: d(-119), lastSeenAt: d(-91) }] },
  { id: "lic_4", planId: "plan_365", planName: "365 วัน", key: "DEMO-SAMPLE-0004-DDDD", status: "pending", purchasedAt: d(0), expiresAt: null, maxAccounts: 1, maxBrowsers: 2, orderId: "ord_4", customerId: "cus_1", activations: [] },
  { id: "lic_5", planId: "plan_90", planName: "90 วัน", key: "DEMO-SAMPLE-0005-EEEE", status: "revoked", purchasedAt: d(-70), expiresAt: d(20), maxAccounts: 1, maxBrowsers: 2, orderId: "ord_5", customerId: "cus_2", activations: [{ id: "act_5", browserLabel: "Chrome บน Windows (ตัวอย่าง)", accountHashPrefix: "19cd…0b7e", firstSeenAt: d(-69), lastSeenAt: d(-30) }] },
  { id: "lic_6", planId: "plan_365", planName: "365 วัน", key: "DEMO-SAMPLE-0006-FFFF", status: "active", purchasedAt: d(-200), expiresAt: d(165), maxAccounts: 2, maxBrowsers: 3, orderId: "ord_6", customerId: "cus_3", activations: [{ id: "act_6", browserLabel: "Chrome บน Windows (ตัวอย่าง)", accountHashPrefix: "c0de…11aa", firstSeenAt: d(-199), lastSeenAt: d(-2) }] },
  { id: "lic_7", planId: "plan_30", planName: "30 วัน", key: "DEMO-SAMPLE-0007-GGGG", status: "active", purchasedAt: d(-8), expiresAt: d(22), maxAccounts: 1, maxBrowsers: 2, orderId: "ord_7", customerId: "cus_4", activations: [] },
];

export const orders: Order[] = [
  { id: "ord_4", number: "IGS-2026-0004", planId: "plan_365", planName: "365 วัน", amountSatang: 149000, paymentStatus: "pending", paymentMethod: "promptpay", createdAt: d(0), customerId: "cus_1", customerEmail: "somchai@example.com", licenseId: "lic_4" },
  { id: "ord_1", number: "IGS-2026-0001", planId: "plan_90", planName: "90 วัน", amountSatang: 49900, paymentStatus: "paid", paymentMethod: "promptpay", createdAt: d(-40), customerId: "cus_1", customerEmail: "somchai@example.com", licenseId: "lic_1" },
  { id: "ord_2", number: "IGS-2026-0002", planId: "plan_30", planName: "30 วัน", amountSatang: 19900, paymentStatus: "paid", paymentMethod: "card", createdAt: d(-25), customerId: "cus_1", customerEmail: "somchai@example.com", licenseId: "lic_2" },
  { id: "ord_3", number: "IGS-2026-0003", planId: "plan_30", planName: "30 วัน", amountSatang: 19900, paymentStatus: "paid", paymentMethod: "promptpay", createdAt: d(-120), customerId: "cus_1", customerEmail: "somchai@example.com", licenseId: "lic_3" },
  { id: "ord_8", number: "IGS-2026-0008", planId: "plan_90", planName: "90 วัน", amountSatang: 49900, paymentStatus: "failed", paymentMethod: "card", createdAt: d(-60), customerId: "cus_1", customerEmail: "somchai@example.com", licenseId: null },
  { id: "ord_5", number: "IGS-2026-0005", planId: "plan_90", planName: "90 วัน", amountSatang: 49900, paymentStatus: "refunded", paymentMethod: "card", createdAt: d(-70), customerId: "cus_2", customerEmail: "napat@example.com", licenseId: "lic_5" },
  { id: "ord_6", number: "IGS-2026-0006", planId: "plan_365", planName: "365 วัน", amountSatang: 149000, paymentStatus: "paid", paymentMethod: "promptpay", createdAt: d(-200), customerId: "cus_3", customerEmail: "ploy@example.com", licenseId: "lic_6" },
  { id: "ord_7", number: "IGS-2026-0007", planId: "plan_30", planName: "30 วัน", amountSatang: 19900, paymentStatus: "paid", paymentMethod: "promptpay", createdAt: d(-8), customerId: "cus_4", customerEmail: "arm@example.com", licenseId: "lic_7" },
  { id: "ord_9", number: "IGS-2026-0009", planId: "plan_30", planName: "30 วัน", amountSatang: 19900, paymentStatus: "canceled", paymentMethod: null, createdAt: d(-3), customerId: "cus_4", customerEmail: "arm@example.com", licenseId: null },
];

export const customers: Customer[] = [
  { id: "cus_1", name: "สมชาย ตัวอย่าง", email: "somchai@example.com", joinedAt: d(-130), orders: 5, activeLicenses: 2, totalSpentSatang: 89700 },
  { id: "cus_2", name: "ณภัทร ทดสอบ", email: "napat@example.com", joinedAt: d(-75), orders: 1, activeLicenses: 0, totalSpentSatang: 0 },
  { id: "cus_3", name: "พลอย ตัวอย่าง", email: "ploy@example.com", joinedAt: d(-210), orders: 1, activeLicenses: 1, totalSpentSatang: 149000 },
  { id: "cus_4", name: "อาร์ม ตัวอย่าง", email: "arm@example.com", joinedAt: d(-9), orders: 2, activeLicenses: 1, totalSpentSatang: 19900 },
];

export const activity: ActivityItem[] = [
  { id: "ev_1", at: d(0), kind: "purchase", text: "สร้างคำสั่งซื้อ IGS-2026-0004 (รอชำระเงิน)" },
  { id: "ev_2", at: d(-3), kind: "activation", text: "มีการเปิดใช้งานไลเซนส์ 90 วัน บน Edge (ตัวอย่าง)" },
  { id: "ev_3", at: d(-25), kind: "license", text: "ได้รับไลเซนส์ 30 วัน หลังชำระเงินสำเร็จ" },
  { id: "ev_4", at: d(-40), kind: "license", text: "ได้รับไลเซนส์ 90 วัน หลังชำระเงินสำเร็จ" },
];
