import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const thDate = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
const thDateTime = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });

export const formatDate = (iso: string | null) => (iso ? thDate.format(new Date(iso)) : "—");
export const formatDateTime = (iso: string | null) => (iso ? thDateTime.format(new Date(iso)) : "—");
export const formatTHB = (satang: number) =>
  "฿" + (satang / 100).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Whole days between `now` and an ISO date (can be negative). */
export function daysUntil(iso: string | null, now: Date = new Date()) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
}
