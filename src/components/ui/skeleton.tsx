import { cn } from "@/lib/utils";
export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cn("skeleton h-4 w-full", className)} />;

export function PageSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">กำลังโหลด…</span>
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
