import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { LicensesView } from "@/components/features/licenses-view";
import { data } from "@/lib/data";

export const metadata: Metadata = { title: "ไลเซนส์ของฉัน" };

export default async function LicensesPage() {
  const licenses = await data.listMyLicenses();
  return (
    <>
      <PageHeading crumbs={[{ label: "แดชบอร์ด", href: "/dashboard" }, { label: "ไลเซนส์ของฉัน" }]} title="ไลเซนส์ของฉัน" description="คัดลอกคีย์ไปกรอกในส่วนขยาย IG Snapper บนเบราว์เซอร์ของคุณ" />
      <LicensesView licenses={licenses} />
    </>
  );
}
