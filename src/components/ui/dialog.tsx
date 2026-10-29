"use client";
import { useEffect, useRef } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean; onClose: () => void; title: string; description?: string;
  children?: React.ReactNode; footer?: React.ReactNode;
  /** "center" dialog or right-hand "drawer" */
  variant?: "center" | "drawer"; className?: string;
}

/**
 * Accessible modal built on the native <dialog> element (focus trap, Esc to close,
 * inert background are handled by the browser).
 */
export function Modal({ open, onClose, title, description, children, footer, variant = "center", className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const drawer = variant === "drawer";
  return (
    <dialog
      ref={ref}
      // Ignore the 'close' event caused by our own programmatic close() (open → false);
      // only user-initiated closes (Esc, backdrop, ✕) should call onClose.
      onClose={() => { if (open) onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-label={title}
      className={cn(
        "m-0 max-h-none max-w-none bg-transparent p-0 text-ink backdrop:bg-black/65 backdrop:backdrop-blur-[2px]",
        drawer ? "ml-auto h-full w-full sm:max-w-md" : "m-auto w-[calc(100%-2rem)] max-w-md",
        "open:animate-fade-in"
      )}
    >
      {open && (
        <div className={cn(
          "flex flex-col border border-line/12 bg-surface shadow-pop",
          drawer ? "h-full animate-slide-in rounded-none border-y-0 border-r-0" : "max-h-[85dvh] animate-pop-in rounded-xl",
          className
        )}>
          <div className="flex items-start justify-between gap-4 border-b border-line/10 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">{title}</h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <button onClick={onClose} aria-label="ปิด" className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"><X className="size-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line/10 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel = "ยืนยัน", danger = false, loading = false, children,
}: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; confirmLabel?: string; danger?: boolean; loading?: boolean; children?: React.ReactNode }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
        <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </>}>
      <div className="flex gap-3">
        {danger && <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />}
        <div className="space-y-3 text-sm text-muted"><p>{description}</p>{children}</div>
      </div>
    </Modal>
  );
}
