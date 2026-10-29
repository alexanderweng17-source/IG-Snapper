"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function useIsActive(href: string, exact = false) {
  const path = usePathname();
  return exact ? path === href : path === href || path.startsWith(href + "/");
}

export function NavLink({ href, exact, className, activeClassName, children, ...rest }: Omit<React.ComponentProps<typeof Link>, "className"> & { exact?: boolean; className?: string; activeClassName?: string }) {
  const active = useIsActive(href.toString(), exact);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn(className, active && activeClassName)} {...rest}>
      {children}
    </Link>
  );
}
