import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import type { LicenseStatus, PaymentStatus } from "@/lib/data/types";
import { CheckCircle2, Clock, XCircle, Ban, RotateCcw, AlertTriangle } from "lucide-react";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
const tones: Record<Tone, string> = {
  neutral: "bg-surface-3 text-muted border-line/10",
  accent: "bg-accent/15 text-[rgb(190_178_255)] border-accent/30",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  danger: "bg-danger/12 text-danger border-danger/25",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

const licenseMap: Record<LicenseStatus, { tone: Tone; Icon: typeof Clock }> = {
  active: { tone: "success", Icon: CheckCircle2 },
  pending: { tone: "warning", Icon: Clock },
  expired: { tone: "neutral", Icon: AlertTriangle },
  revoked: { tone: "danger", Icon: Ban },
};
export function LicenseStatusBadge({ status }: { status: LicenseStatus }) {
  const { tone, Icon } = licenseMap[status];
  return <Badge tone={tone}><Icon className="size-3.5" aria-hidden />{t.licenseStatus[status]}</Badge>;
}

const payMap: Record<PaymentStatus, { tone: Tone; Icon: typeof Clock }> = {
  paid: { tone: "success", Icon: CheckCircle2 },
  pending: { tone: "warning", Icon: Clock },
  failed: { tone: "danger", Icon: XCircle },
  refunded: { tone: "accent", Icon: RotateCcw },
  canceled: { tone: "neutral", Icon: Ban },
};
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { tone, Icon } = payMap[status];
  return <Badge tone={tone}><Icon className="size-3.5" aria-hidden />{t.paymentStatus[status]}</Badge>;
}
