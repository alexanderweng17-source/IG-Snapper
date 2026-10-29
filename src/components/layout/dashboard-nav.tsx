import { LayoutDashboard, KeyRound, ReceiptText, LifeBuoy, UserCog, ShoppingCart, Users, PackageOpen } from "lucide-react";
import type { ShellNavItem } from "./app-shell";
import { t } from "@/i18n";

const ic = "size-[18px] shrink-0";
export const customerNav: ShellNavItem[] = [
  { href: "/dashboard", label: t.dash.overview, exact: true, icon: <LayoutDashboard className={ic} aria-hidden /> },
  { href: "/dashboard/licenses", label: t.dash.licenses, icon: <KeyRound className={ic} aria-hidden /> },
  { href: "/dashboard/orders", label: t.dash.orders, icon: <ReceiptText className={ic} aria-hidden /> },
  { href: "/dashboard/support", label: t.dash.support, icon: <LifeBuoy className={ic} aria-hidden /> },
  { href: "/dashboard/profile", label: t.dash.profile, icon: <UserCog className={ic} aria-hidden /> },
];
export const adminNav: ShellNavItem[] = [
  { href: "/admin", label: t.admin.overview, exact: true, icon: <LayoutDashboard className={ic} aria-hidden /> },
  { href: "/admin/orders", label: t.admin.orders, icon: <ShoppingCart className={ic} aria-hidden /> },
  { href: "/admin/licenses", label: t.admin.licenses, icon: <KeyRound className={ic} aria-hidden /> },
  { href: "/admin/products", label: t.admin.products, icon: <PackageOpen className={ic} aria-hidden /> },
  { href: "/admin/customers", label: t.admin.customers, icon: <Users className={ic} aria-hidden /> },
];
