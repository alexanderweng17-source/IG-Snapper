import { PublicLayoutShell } from "@/components/layout/public-layout-shell";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayoutShell>{children}</PublicLayoutShell>;
}
