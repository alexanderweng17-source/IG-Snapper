import { FlaskConical } from "lucide-react";
export function DemoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div role="note" className="mb-6 flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning">
      <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}
