import Link from "next/link";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return <img src="/icon.svg" alt="" aria-hidden="true" className={className} />;
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-md font-semibold tracking-tight">
      <LogoMark /> <span className="text-[17px]">IG Snapper</span>
    </Link>
  );
}
