import { cn } from "@/lib/utils";

export function Card({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-line/10 bg-surface shadow-card", className)} {...rest} />;
}
export function CardHeader({ title, description, action, className }: { title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-line/10 px-5 py-4", className)}>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export const CardBody = ({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("p-5", className)} {...rest} />;
