import { AppShell } from "@/components/layout/app-shell";
import { adminNav } from "@/components/layout/dashboard-nav";
import { data } from "@/lib/data";
import { requireAdminUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();
  const profile = await data.getMyProfile();
  return <AppShell items={adminNav} area="admin" user={profile}>{children}</AppShell>;
}
