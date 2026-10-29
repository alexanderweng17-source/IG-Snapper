"use client";
import { useId, useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-md border border-line/15 bg-surface-2 px-3 text-[15px] text-ink placeholder:text-faint transition-colors hover:border-line/25 focus-visible:border-accent/70 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger/70";

interface FieldShellProps {
  label: string; hint?: string; error?: string; id: string; children: React.ReactNode; className?: string;
}
export function FieldShell({ label, hint, error, id, children, className }: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">{label}</label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

type BaseProps = { label: string; hint?: string; error?: string; wrapperClassName?: string };

export function TextField({ label, hint, error, wrapperClassName, className, id: idProp, ...rest }: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId(); const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} className={cn(control, "h-11", className)} {...rest} />
    </FieldShell>
  );
}

export function PasswordField({ label, hint, error, wrapperClassName, id: idProp, ...rest }: BaseProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const auto = useId(); const id = idProp ?? auto;
  const [shown, setShown] = useState(false);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <div className="relative">
        <input id={id} type={shown ? "text" : "password"} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} className={cn(control, "h-11 pr-11")} {...rest} />
        <button type="button" onClick={() => setShown((s) => !s)} aria-pressed={shown} aria-label={shown ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          className="absolute right-1 top-1 grid size-9 place-items-center rounded-md text-faint hover:text-ink">
          {shown ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    </FieldShell>
  );
}

export function TextArea({ label, hint, error, wrapperClassName, className, id: idProp, ...rest }: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId(); const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <textarea id={id} aria-invalid={!!error} className={cn(control, "min-h-28 py-2.5", className)} {...rest} />
    </FieldShell>
  );
}

export function SelectField({ label, hint, error, wrapperClassName, className, id: idProp, children, ...rest }: BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId(); const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <select id={id} aria-invalid={!!error} className={cn(control, "h-11 pr-8", className)} {...rest}>{children}</select>
    </FieldShell>
  );
}

/** Compact select/search used in toolbars (visually-hidden label for a11y). */
export function ToolbarSelect({ label, className, children, ...rest }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={cn("block", className)}>
      <span className="sr-only">{label}</span>
      <select className={cn(control, "h-10")} {...rest}>{children}</select>
    </label>
  );
}
