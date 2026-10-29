import type {
  AdminSummary, Customer, DashboardSummary, License, Order, Plan, Profile,
} from "./types";

/**
 * The single seam between UI and backend.
 * The production adapter lives in `supabase-adapter.ts`; mock data remains
 * available only as a development/design reference.
 *
 * Admin methods: the backend MUST enforce authorization; the UI is not a
 * security boundary.
 */
export interface DataAdapter {
  // public
  listPlans(opts?: { includeHidden?: boolean }): Promise<Plan[]>;
  getPlan(slug: string): Promise<Plan | null>;
  // customer (scoped to the authenticated user by the backend)
  getDashboardSummary(): Promise<DashboardSummary>;
  listMyLicenses(): Promise<License[]>;
  listMyOrders(): Promise<Order[]>;
  getMyProfile(): Promise<Profile>;
  // admin
  getAdminSummary(): Promise<AdminSummary>;
  listAllOrders(): Promise<Order[]>;
  listAllLicenses(): Promise<License[]>;
  listCustomers(): Promise<Customer[]>;
  listAllPlans(): Promise<Plan[]>;
}
