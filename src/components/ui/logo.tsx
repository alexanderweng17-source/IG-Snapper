import Link from "next/link";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="rgb(var(--accent))" />
      <path d="M9 12.5V10a1 1 0 0 1 1-1h2.5M23 12.5V10a1 1 0 0 0-1-1h-2.5M9 19.5V22a1 1 0 0 0 1 1h2.5M23 19.5V22a1 1 0 0 1-1 1h-2.5" stroke="rgb(var(--accent-ink))" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="16" r="3" fill="rgb(var(--accent-ink))" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-md font-semibold tracking-tight">
      <LogoMark /> <span className="text-[17px]">IG Snapper</span>
    </Link>
  );
}
