import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "./button";

export function EmptyState({ icon: Icon = Inbox, title, description, action }: { icon?: typeof Inbox; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-surface-3 text-muted"><Icon className="size-6" aria-hidden /></div>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "เกิดข้อผิดพลาด", description = "ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาลองอีกครั้ง", onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-danger/15 text-danger"><AlertTriangle className="size-6" aria-hidden /></div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {onRetry && <Button className="mt-5" variant="secondary" onClick={onRetry}>ลองอีกครั้ง</Button>}
    </div>
  );
}
