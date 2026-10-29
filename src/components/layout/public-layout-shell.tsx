"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const PREVIEW_ROUTES = new Set(["/", "/pricing", "/download", "/faq", "/checkout"]);

export function PublicLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (PREVIEW_ROUTES.has(pathname)) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
