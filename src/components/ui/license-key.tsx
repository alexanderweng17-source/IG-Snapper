"use client";
import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "./button";
import { useToast } from "./toast";
import { cn } from "@/lib/utils";

export function maskKey(key: string) {
  const parts = key.split("-");
  if (parts.length < 2) return "•".repeat(Math.max(8, key.length));
  return parts.map((p, i) => (i === 0 || i === parts.length - 1 ? p : "•".repeat(p.length))).join("-");
}

/**
 * Masked-by-default key with reveal + copy. The key itself always comes from props
 * (server data) — nothing here generates keys.
 */
export function LicenseKey({ value, disabled, className }: { value: string; disabled?: boolean; className?: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast("คัดลอกคีย์แล้ว", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("คัดลอกไม่สำเร็จ กรุณาแสดงคีย์แล้วคัดลอกด้วยตนเอง", "error");
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <code aria-label={shown ? "คีย์ไลเซนส์" : "คีย์ไลเซนส์ (ถูกซ่อนอยู่)"} className="min-w-0 flex-1 truncate rounded-md border border-line/10 bg-bg px-3 py-2 font-mono text-[13px] tracking-wide text-ink">
        {disabled ? "ยังไม่มีคีย์" : shown ? value : maskKey(value)}
      </code>
      <Button size="sm" variant="secondary" disabled={disabled} onClick={() => setShown((s) => !s)} aria-pressed={shown} aria-label={shown ? "ซ่อนคีย์" : "แสดงคีย์"}>
        {shown ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </Button>
      <Button size="sm" variant="secondary" disabled={disabled} onClick={copy} aria-label="คัดลอกคีย์">
        {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        <span className="hidden sm:inline">{copied ? "คัดลอกแล้ว" : "คัดลอก"}</span>
      </Button>
    </div>
  );
}
