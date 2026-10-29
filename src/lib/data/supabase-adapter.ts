import "server-only";
import type { DataAdapter } from "./adapter";
import type { Activation, AdminSummary, Customer, DashboardSummary, License, Order, PaymentStatus, Plan, Profile } from "./types";
import { storePlans } from "@/lib/store/plans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, isAdminEmail } from "@/lib/supabase/auth";

function required<T>(value: T | null | undefined, message = "ข้อมูลไม่พร้อมใช้งาน"): T {
  if (value === null || value === undefined) throw new Error(message);
  return value;
}

async function userOrThrow() {
  return required(await getCurrentUser(), "ต้องเข้าสู่ระบบก่อน");
}

async function adminUserOrThrow() {
  const user = await userOrThrow();
  if (!isAdminEmail(user.email)) throw new Error("ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ดูแล");
  return user;
}

function mapOrder(row: any): Order {
  const status = (row.payment_status || "pending") as PaymentStatus;
  return {
    id: row.id,
    number: row.order_number,
    planId: row.plan_slug,
    planName: row.plan_name,
    amountSatang: row.amount_satang,
    paymentStatus: status,
    paymentMethod: row.payment_method === "promptpay" || row.payment_method === "card" ? row.payment_method : null,
    createdAt: row.created_at,
    customerId: row.user_id,
    customerEmail: row.customer_email || undefined,
    licenseId: row.license_key_hash || null,
  };
}

function mapActivation(row: any): Activation {
  return {
    id: `${row.key_hash}:${row.kind}:${row.value}`,
    browserLabel: row.kind === "device" ? "อุปกรณ์ที่เปิดใช้งาน" : "บัญชีที่ผูกไว้",
    accountHashPrefix: row.kind === "account" ? `${String(row.value).slice(0, 4)}…${String(row.value).slice(-4)}` : "—",
    firstSeenAt: row.first_seen,
    lastSeenAt: row.last_seen,
  };
}

async function buildLicenses(orderRows: any[], includeUnlinked = false): Promise<License[]> {
  const admin = createSupabaseAdminClient();
  const hashes = [...new Set(orderRows.map((r) => r.license_key_hash).filter(Boolean))] as string[];
  let licenseRows: any[] = [];
  let activationRows: any[] = [];
  let secretRows: any[] = [];

  if (includeUnlinked) {
    const { data, error } = await admin.from("licenses").select("key_hash,label,status,expires_at,max_accounts,max_devices,created_at,last_seen_at").order("created_at", { ascending: false });
    if (error) throw error;
    licenseRows = data ?? [];
  } else if (hashes.length) {
    const { data, error } = await admin.from("licenses").select("key_hash,label,status,expires_at,max_accounts,max_devices,created_at,last_seen_at").in("key_hash", hashes);
    if (error) throw error;
    licenseRows = data ?? [];
  }

  const allHashes = includeUnlinked ? licenseRows.map((r) => r.key_hash) : hashes;
  if (allHashes.length) {
    const activationQuery = admin
      .from("license_activations")
      .select("key_hash,kind,value,first_seen,last_seen")
      .in("key_hash", allHashes);
    const orderIds = orderRows.map((r) => r.id).filter(Boolean);
    const [actRes, secRes] = await Promise.all([
      activationQuery,
      orderIds.length
        ? admin.from("web_license_secrets").select("order_id,user_id,license_key,created_at").in("order_id", orderIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (actRes.error) throw actRes.error;
    if (secRes.error) throw secRes.error;
    activationRows = actRes.data ?? [];
    secretRows = secRes.data ?? [];
  }

  const orderByHash = new Map(orderRows.filter((r) => r.license_key_hash).map((r) => [r.license_key_hash, r]));
  const secretByOrder = new Map(secretRows.map((r) => [r.order_id, r]));
  const activationsByHash = new Map<string, Activation[]>();
  for (const row of activationRows) {
    const items = activationsByHash.get(row.key_hash) ?? [];
    items.push(mapActivation(row));
    activationsByHash.set(row.key_hash, items);
  }

  return licenseRows.map((row) => {
    const order = orderByHash.get(row.key_hash);
    const secret = order ? secretByOrder.get(order.id) : null;
    const expiry = row.expires_at as string | null;
    const isExpired = Boolean(expiry && new Date(expiry).getTime() < Date.now());
    const status = row.status === "revoked" ? "revoked" : isExpired ? "expired" : "active";
    return {
      id: row.key_hash,
      planId: order?.plan_slug ?? row.label ?? "manual",
      planName: order?.plan_name ?? row.label ?? "ไลเซนส์ที่ออกด้วยตนเอง",
      key: secret?.license_key ?? "คีย์เดิมไม่สามารถกู้คืนได้ (ระบบเก็บเฉพาะแฮช)",
      status,
      purchasedAt: order?.created_at ?? row.created_at,
      expiresAt: expiry,
      maxAccounts: row.max_accounts,
      maxBrowsers: row.max_devices,
      activations: activationsByHash.get(row.key_hash) ?? [],
      orderId: order?.id ?? "manual",
      customerId: order?.user_id,
    } satisfies License;
  }).sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
}

async function allOrderRows() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("web_orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export const supabaseAdapter: DataAdapter = {
  listPlans: async (opts) => storePlans.filter((p) => opts?.includeHidden || p.visible),
  listAllPlans: async () => storePlans,
  getPlan: async (slug) => storePlans.find((p) => p.slug === slug) ?? null,

  getMyProfile: async (): Promise<Profile> => {
    const user = await userOrThrow();
    const name = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "ลูกค้า");
    return { name, email: user.email || "" };
  },

  listMyOrders: async () => {
    const user = await userOrThrow();
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("web_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({ ...mapOrder(row), customerEmail: user.email || undefined }));
  },

  listMyLicenses: async () => {
    const user = await userOrThrow();
    const admin = createSupabaseAdminClient();
    const { data: orders, error } = await admin.from("web_orders").select("*").eq("user_id", user.id).eq("payment_status", "paid").not("license_key_hash", "is", null).order("created_at", { ascending: false });
    if (error) throw error;
    return buildLicenses(orders ?? []);
  },

  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const [profile, orders, licenses] = await Promise.all([
      supabaseAdapter.getMyProfile(),
      supabaseAdapter.listMyOrders(),
      supabaseAdapter.listMyLicenses(),
    ]);
    const active = licenses.filter((l) => l.status === "active" && l.expiresAt).sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime());
    const next = active[0];
    const activity = [
      ...orders.slice(0, 5).map((o) => ({ id: `order-${o.id}`, at: o.createdAt, kind: "purchase" as const, text: `คำสั่งซื้อ ${o.number} · ${o.paymentStatus === "paid" ? "ชำระแล้ว" : o.paymentStatus === "pending" ? "รอชำระเงิน" : o.paymentStatus}` })),
      ...licenses.slice(0, 5).map((l) => ({ id: `license-${l.id}`, at: l.purchasedAt, kind: "license" as const, text: `ได้รับไลเซนส์ ${l.planName}` })),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8);
    return {
      customerName: profile.name,
      activeLicenses: licenses.filter((l) => l.status === "active").length,
      nextExpiry: next ? { licenseId: next.id, planName: next.planName, expiresAt: next.expiresAt! } : null,
      recentOrders: orders.slice(0, 3),
      activity,
    };
  },

  getAdminSummary: async (): Promise<AdminSummary> => {
    await adminUserOrThrow();
    const [orders, licenses, customers] = await Promise.all([supabaseAdapter.listAllOrders(), supabaseAdapter.listAllLicenses(), supabaseAdapter.listCustomers()]);
    const paid = orders.filter((o) => o.paymentStatus === "paid");
    return {
      revenueSatang: paid.reduce((sum, o) => sum + o.amountSatang, 0),
      paidOrders: paid.length,
      activeLicenses: licenses.filter((l) => l.status === "active").length,
      customers: customers.length,
      recentOrders: orders.slice(0, 5),
      attention: orders.filter((o) => o.paymentStatus === "pending").slice(0, 5).map((o) => ({ id: o.id, label: "คำสั่งซื้อรอชำระเงิน", detail: `${o.number} · รอการยืนยันจาก Stripe`, tone: "warning" as const })),
    };
  },

  listAllOrders: async () => {
    await adminUserOrThrow();
    const rows = await allOrderRows();
    return rows.map((row: any) => mapOrder(row));
  },

  listAllLicenses: async () => {
    await adminUserOrThrow();
    const rows = await allOrderRows();
    return buildLicenses(rows, true);
  },

  listCustomers: async () => {
    await adminUserOrThrow();
    const admin = createSupabaseAdminClient();
    const [usersRes, orders] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      allOrderRows(),
    ]);
    if (usersRes.error) throw usersRes.error;
    const users = usersRes.data.users ?? [];
    return users.map((user) => {
      const own = orders.filter((o: any) => o.user_id === user.id);
      const paid = own.filter((o: any) => o.payment_status === "paid");
      const name = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "ลูกค้า");
      return {
        id: user.id,
        name,
        email: user.email || "",
        joinedAt: user.created_at,
        orders: own.length,
        activeLicenses: paid.filter((o: any) => o.license_key_hash).length,
        totalSpentSatang: paid.reduce((sum: number, o: any) => sum + o.amount_satang, 0),
      } satisfies Customer;
    }).sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
  },
};
