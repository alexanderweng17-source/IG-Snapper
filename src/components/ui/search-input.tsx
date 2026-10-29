import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchInput({ label, className, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
      <input type="search" className="h-10 w-full rounded-md border border-line/15 bg-surface-2 pl-9 pr-3 text-[15px] placeholder:text-faint hover:border-line/25 focus-visible:border-accent/70 focus-visible:outline-offset-0" {...rest} />
    </label>
  );
}
