import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { ProfileForms } from "@/components/features/profile-forms";
import { data } from "@/lib/data";

export const metadata: Metadata = { title: "ตั้งค่าบัญชี" };

export default async function ProfilePage() {
  const p = await data.getMyProfile();
  return (
    <>
      <PageHeading crumbs={[{ label: "แดชบอร์ด", href: "/dashboard" }, { label: "ตั้งค่าบัญชี" }]} title="ตั้งค่าบัญชี" />
      <ProfileForms name={p.name} email={p.email} />
    </>
  );
}
