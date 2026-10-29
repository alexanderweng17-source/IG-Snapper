import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CheckoutStatus({ icon: Icon, tone, title, children, actions }: { icon: React.ComponentType<{ className?: string }>; tone: "info" | "warning" | "neutral"; title: string; children: React.ReactNode; actions: React.ReactNode }) {
  const toneCls = { info: "bg-accent/15 text-accent", warning: "bg-warning/15 text-warning", neutral: "bg-surface-3 text-muted" }[tone];
  return (
    <div className="container-page max-w-xl py-16 sm:py-24">
      <div className="rounded-xl border border-line/10 bg-surface p-6 text-center shadow-card sm:p-10">
        <div className={cn("mx-auto grid size-14 place-items-center rounded-full", toneCls)}><Icon className="size-7" /></div>
        <h1 className="mt-6 text-2xl font-semibold">{title}</h1>
        <div className="mt-3 space-y-3 text-[15px] text-muted">{children}</div>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">{actions}</div>
      </div>
    </div>
  );
}
export { ButtonLink };
