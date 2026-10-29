import type { Plan } from "@/lib/data/types";

type PriceConfig = { value: number; configured: boolean };
function priceFromEnv(name: string, placeholder: number): PriceConfig {
  const raw = process.env[name];
  if (!raw?.trim()) return { value: placeholder, configured: false };
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) return { value: placeholder, configured: false };
  return { value, configured: true };
}

const p30 = priceFromEnv("STORE_PRICE_30_DAYS_SATANG", 19900);
const p90 = priceFromEnv("STORE_PRICE_90_DAYS_SATANG", 49900);
const p365 = priceFromEnv("STORE_PRICE_365_DAYS_SATANG", 149000);

export const storePlans: Plan[] = [
  { id: "plan_30", slug: "30-days", name: "30 วัน", durationDays: 30, priceSatang: p30.value, isPlaceholderPrice: !p30.configured, visible: true, tagline: "ลองใช้งานระยะสั้น" },
  { id: "plan_90", slug: "90-days", name: "90 วัน", durationDays: 90, priceSatang: p90.value, isPlaceholderPrice: !p90.configured, visible: true, highlight: true, tagline: "เหมาะกับการใช้งานต่อเนื่อง" },
  { id: "plan_365", slug: "365-days", name: "365 วัน", durationDays: 365, priceSatang: p365.value, isPlaceholderPrice: !p365.configured, visible: true, tagline: "ราคาต่อวันต่ำที่สุด" },
];

export function getStorePlan(slug: string) {
  return storePlans.find((plan) => plan.slug === slug && plan.visible) ?? null;
}

export function checkoutIsEnabled(plan: Plan) {
  return process.env.STORE_CHECKOUT_ENABLED === "true" && !plan.isPlaceholderPrice;
}
