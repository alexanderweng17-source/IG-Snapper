"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, Laptop } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LicenseStatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { LicenseKey } from "@/components/ui/license-key";
import { SearchInput } from "@/components/ui/search-input";
import { ToolbarSelect } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { formatDate, formatDateTime, daysUntil } from "@/lib/utils";
import { t } from "@/i18n";
import type { License, LicenseStatus } from "@/lib/data/types";

export function ExpiryText({ license }: { license: License }) {
  if (license.status === "pending") return <span className="text-muted">เริ่มนับหลังยืนยันการชำระเงิน</span>;
  const left = daysUntil(license.expiresAt, new Date());
  return (
    <span>{formatDate(license.expiresAt)}{license.status === "active" && left !== null && (
      <span className={left <= 7 ? "ml-2 text-warning" : "ml-2 text-faint"}>(อีก {left} วัน)</span>)}</span>
  );
}

export function LicensesView({ licenses }: { licenses: License[] }) {
  const [q, setQ] = useState(""); const [status, setStatus] = useState<"all" | LicenseStatus>("all");
  const [sel, setSel] = useState<License | null>(null);
  const rows = useMemo(() => licenses.filter((l) => (status === "all" || l.status === status) && (!q.trim() || `${l.planName} ${l.status}`.toLowerCase().includes(q.trim().toLowerCase()))), [licenses, q, status]);

  if (licenses.length === 0) return <Card><EmptyState icon={KeyRound} title="ยังไม่มีไลเซนส์" description="เมื่อชำระเงินและระบบยืนยันแล้ว คีย์จะแสดงที่นี่" action={<ButtonLink href="/pricing">ดูแพ็กเกจ</ButtonLink>} /></Card>;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <SearchInput label="ค้นหาไลเซนส์" placeholder="ค้นหาแพ็กเกจหรือสถานะ" value={q} onChange={(e) => setQ(e.target.value)} />
        <ToolbarSelect label="กรองตามสถานะ" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">ทุกสถานะ</option>
          {(Object.keys(t.licenseStatus) as LicenseStatus[]).map((s) => <option key={s} value={s}>{t.licenseStatus[s]}</option>)}
        </ToolbarSelect>
      </div>
      {rows.length === 0 ? <Card><EmptyState title={t.common.noResults} /></Card> : rows.map((l) => {
        const usable = l.status === "active";
        return (
          <Card key={l.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3"><h2 className="font-semibold">ไลเซนส์ {l.planName}</h2><LicenseStatusBadge status={l.status} /></div>
              <Button size="sm" variant="ghost" onClick={() => setSel(l)}>{t.common.details}</Button>
            </div>
            <LicenseKey value={l.key} disabled={l.status === "pending"} className="mt-4" />
            {!usable && l.status !== "pending" && <p className="mt-2 text-xs text-faint">{l.status === "expired" ? "ไลเซนส์นี้หมดอายุแล้ว คีย์ใช้งานไม่ได้" : "ไลเซนส์นี้ถูกเพิกถอน คีย์ใช้งานไม่ได้ หากมีข้อสงสัยให้ติดต่อฝ่ายช่วยเหลือ"}</p>}
            {l.status === "pending" && <p className="mt-2 text-xs text-faint">กำลังรอการยืนยันการชำระเงิน คีย์จะแสดงเมื่อยืนยันแล้ว</p>}
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
              <div><dt className="text-faint">ซื้อเมื่อ</dt><dd>{formatDate(l.purchasedAt)}</dd></div>
              <div><dt className="text-faint">หมดอายุ</dt><dd><ExpiryText license={l} /></dd></div>
              <div><dt className="text-faint">จำกัดบัญชี Instagram</dt><dd>{l.maxAccounts} บัญชี</dd></div>
              <div><dt className="text-faint">จำกัดเบราว์เซอร์</dt><dd>{l.maxBrowsers} เบราว์เซอร์ (ใช้แล้ว {l.activations.length})</dd></div>
            </dl>
          </Card>
        );
      })}

      <Modal open={!!sel} onClose={() => setSel(null)} variant="drawer" title={sel ? `ไลเซนส์ ${sel.planName}` : ""} description="ข้อมูลการเปิดใช้งานเป็นข้อมูลตัวอย่าง">
        {sel && (
          <div className="space-y-6 text-sm">
            <LicenseStatusBadge status={sel.status} />
            <LicenseKey value={sel.key} disabled={sel.status === "pending"} />
            <div>
              <h3 className="mb-2 font-medium">อุปกรณ์ที่เปิดใช้งาน ({sel.activations.length}/{sel.maxBrowsers})</h3>
              {sel.activations.length === 0 ? <p className="rounded-md bg-surface-2 p-3 text-muted">ยังไม่มีการเปิดใช้งาน ติดตั้งส่วนขยายแล้วกรอกคีย์เพื่อเริ่มใช้งาน (<Link href="/download" className="text-accent hover:underline">วิธีติดตั้ง</Link>)</p> : (
                <ul className="space-y-2">
                  {sel.activations.map((a) => (
                    <li key={a.id} className="rounded-md border border-line/10 bg-surface-2 p-3">
                      <p className="flex items-center gap-2 font-medium"><Laptop className="size-4 text-muted" aria-hidden />{a.browserLabel}</p>
                      <p className="mt-1 text-xs text-faint">บัญชี (แฮช): <span className="font-mono">{a.accountHashPrefix}</span></p>
                      <p className="text-xs text-faint">ใช้ครั้งแรก {formatDateTime(a.firstSeenAt)} · ล่าสุด {formatDateTime(a.lastSeenAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-faint">ระบบแสดงเฉพาะค่าแฮชของบัญชี Instagram ไม่แสดงชื่อผู้ใช้ หากต้องการย้ายอุปกรณ์ ให้ติดต่อฝ่ายช่วยเหลือ</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
