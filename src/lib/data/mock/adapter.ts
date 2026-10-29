import type { DataAdapter } from "../adapter";
import { activity, customers, licenses, orders, plans } from "./data";

/** Small artificial delay so loading skeletons are exercised in the prototype. */
const wait = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const ME = "cus_1";
const time = (x: { createdAt?: string; purchasedAt?: string }) => new Date(x.createdAt ?? x.purchasedAt ?? 0).getTime();
const byDateDesc = (a: { createdAt?: string; purchasedAt?: string }, b: { createdAt?: string; purchasedAt?: string }) => time(b) - time(a);

export const mockAdapter: DataAdapter = {
  listPlans: async (opts) => wait(plans.filter((p) => opts?.includeHidden || p.visible), 50),
  listAllPlans: async () => wait(plans, 100),
  getPlan: async (slug) => wait(plans.find((p) => p.slug === slug) ?? null, 50),

  getDashboardSummary: async () => {
    const active = licenses.filter((l) => l.customerId === ME && l.status === "active" && l.expiresAt);
    const next = [...active].sort((a, b) => +new Date(a.expiresAt!) - +new Date(b.expiresAt!))[0];
    return wait({
      customerName: "สมชาย",
      activeLicenses: active.length,
      nextExpiry: next ? { licenseId: next.id, planName: next.planName, expiresAt: next.expiresAt! } : null,
      recentOrders: orders.filter((o) => o.customerId === ME).sort(byDateDesc).slice(0, 3),
      activity,
    });
  },
  listMyLicenses: async () => wait(licenses.filter((l) => l.customerId === ME).sort(byDateDesc)),
  listMyOrders: async () => wait(orders.filter((o) => o.customerId === ME).sort(byDateDesc)),
  getMyProfile: async () => wait({ name: "สมชาย ตัวอย่าง", email: "somchai@example.com" }, 100),

  getAdminSummary: async () => {
    const paid = orders.filter((o) => o.paymentStatus === "paid");
    return wait({
      revenueSatang: paid.reduce((s, o) => s + o.amountSatang, 0),
      paidOrders: paid.length,
      activeLicenses: licenses.filter((l) => l.status === "active").length,
      customers: customers.length,
      recentOrders: [...orders].sort(byDateDesc).slice(0, 5),
      attention: [
        { id: "a1", label: "คำสั่งซื้อรอชำระเงิน", detail: "IGS-2026-0004 · รอการยืนยันการชำระเงินจากระบบหลังบ้าน (ในอนาคต)", tone: "warning" as const },
        { id: "a2", label: "ไลเซนส์ใกล้หมดอายุ", detail: "DEMO-SAMPLE-0002 หมดอายุใน 5 วัน", tone: "warning" as const },
        { id: "a3", label: "การชำระเงินไม่สำเร็จ", detail: "IGS-2026-0008 · ตัวอย่างข้อมูลการชำระเงินที่ล้มเหลว", tone: "danger" as const },
      ],
    });
  },
  listAllOrders: async () => wait([...orders].sort(byDateDesc)),
  listAllLicenses: async () => wait([...licenses].sort(byDateDesc)),
  listCustomers: async () => wait(customers),
};
