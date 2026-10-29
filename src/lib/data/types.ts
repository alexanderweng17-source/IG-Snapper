/**
 * Domain types for the storefront. These describe what the UI needs; they are
 * deliberately NOT a database schema. The existing Supabase license tables are
 * untouched — a future adapter maps its rows into these shapes.
 * Money is stored in satang (1 THB = 100 satang) to avoid float errors.
 */
export type LicenseStatus = "active" | "expired" | "revoked" | "pending";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded" | "canceled";

export interface Plan {
  id: string;
  slug: string;
  name: string;
  durationDays: number;
  priceSatang: number;
  isPlaceholderPrice: boolean;
  visible: boolean;
  highlight?: boolean;
  tagline: string;
}

export interface Activation {
  id: string;
  /** Label for the registered device/account activation. */
  browserLabel: string;
  /** One-way hash prefix of the Instagram account id — never the raw id. */
  accountHashPrefix: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface License {
  id: string;
  planId: string;
  planName: string;
  /** Full key is returned only for the signed-in owner of the corresponding order. */
  key: string;
  status: LicenseStatus;
  purchasedAt: string;
  expiresAt: string | null;
  maxAccounts: number;
  maxBrowsers: number;
  activations: Activation[];
  orderId: string;
  customerId?: string;
}

export interface Order {
  id: string;
  number: string;
  planId: string;
  planName: string;
  amountSatang: number;
  paymentStatus: PaymentStatus;
  paymentMethod: "promptpay" | "card" | null;
  createdAt: string;
  customerId?: string;
  customerEmail?: string;
  licenseId: string | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  orders: number;
  activeLicenses: number;
  totalSpentSatang: number;
}

export interface ActivityItem {
  id: string;
  at: string;
  kind: "purchase" | "license" | "activation" | "support";
  text: string;
}

export interface DashboardSummary {
  customerName: string;
  activeLicenses: number;
  nextExpiry: { licenseId: string; planName: string; expiresAt: string } | null;
  recentOrders: Order[];
  activity: ActivityItem[];
}

export interface AdminSummary {
  revenueSatang: number;
  paidOrders: number;
  activeLicenses: number;
  customers: number;
  recentOrders: Order[];
  attention: { id: string; label: string; detail: string; tone: "warning" | "danger" }[];
}

export interface Profile { name: string; email: string }
