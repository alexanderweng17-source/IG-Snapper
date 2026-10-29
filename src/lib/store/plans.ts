import type { Plan } from "@/lib/data/types";

type PriceConfig = { value: number; configured: boolean };
function priceFromEnv(name: string, placeholder: number): PriceConfig {
  const raw = process.env[name];
  if (!raw?.trim()) return { value: placeholder, configured: false };
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) return { value: placeholder, configured: false };
  return { value, configured: true };
}

// Prices mirror the supplied preview only; they remain placeholders until the owner confirms them.
const p7 = priceFromEnv("STORE_PRICE_7_DAYS_SATANG", 5900);
const p30 = priceFromEnv("STORE_PRICE_30_DAYS_SATANG", 19900);
const p365 = priceFromEnv("STORE_PRICE_365_DAYS_SATANG", 129000);
const pricesConfirmed = process.env.STORE_PRICES_CONFIRMED === "true";

export const storePlans: Plan[] = [
  { id: "plan_7", slug: "7-days", name: "7 วัน", durationDays: 7, priceSatang: p7.value, isPlaceholderPrice: !p7.configured || !pricesConfirmed, visible: true, tagline: "ลองใช้งานก่อนตัดสินใจ" },
  { id: "plan_30", slug: "30-days", name: "30 วัน", durationDays: 30, priceSatang: p30.value, isPlaceholderPrice: !p30.configured || !pricesConfirmed, visible: true, tagline: "เหมาะกับการใช้งานต่อเนื่อง" },
  { id: "plan_365", slug: "365-days", name: "365 วัน", durationDays: 365, priceSatang: p365.value, isPlaceholderPrice: !p365.configured || !pricesConfirmed, visible: true, highlight: true, tagline: "ราคาต่อวันต่ำที่สุด ใช้ยาวทั้งปี" },
];

export function getStorePlan(slug: string) {
  return storePlans.find((plan) => plan.slug === slug && plan.visible) ?? null;
}

export function checkoutConfigurationIssues(plan: Plan): string[] {
  const issues: string[] = [];
  if (plan.isPlaceholderPrice) issues.push("กำหนดราคาจริงของแพ็กเกจ");
  if (!process.env.STRIPE_SECRET_KEY) issues.push("ตั้งค่า STRIPE_SECRET_KEY");
  if (!process.env.STRIPE_WEBHOOK_SECRET) issues.push("ตั้งค่า STRIPE_WEBHOOK_SECRET");
  if (!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    issues.push("ตั้งค่า SUPABASE_SECRET_KEY");
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl || !siteUrl.startsWith("https://")) issues.push("ตั้งค่า NEXT_PUBLIC_SITE_URL เป็น HTTPS");
  return issues;
}

export function checkoutIsEnabled(plan: Plan) {
  return process.env.STORE_CHECKOUT_ENABLED === "true" && checkoutConfigurationIssues(plan).length === 0;
}
