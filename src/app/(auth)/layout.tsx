import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { t } from "@/i18n";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="container-page flex h-16 items-center justify-between">
        <Logo />
        <Link href="/pricing" className="text-sm text-muted hover:text-ink">ดูแพ็กเกจ</Link>
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
      <footer className="container-page pb-8 text-center text-xs text-faint">{t.disclaimer}</footer>
    </div>
  );
}
