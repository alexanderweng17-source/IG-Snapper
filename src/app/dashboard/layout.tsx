import { AppShell } from "@/components/layout/app-shell";
import { customerNav } from "@/components/layout/dashboard-nav";
import { data } from "@/lib/data";
import { requireUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/dashboard");
  const profile = await data.getMyProfile();
  return <AppShell items={customerNav} area="customer" user={profile}>{children}</AppShell>;
}
