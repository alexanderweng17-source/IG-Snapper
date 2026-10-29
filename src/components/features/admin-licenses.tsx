"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, CalendarPlus, KeyRound, RotateCcw } from "lucide-react";
import { runLicenseAdminAction, type LicenseAdminAction } from "@/app/admin/licenses/actions";
import { Card } from "@/components/ui/card";
import { LicenseStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { ToolbarSelect, TextField } from "@/components/ui/field";
import { Pagination, paginate } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatDateTime } from "@/lib/utils";
import { maskKey } from "@/components/ui/license-key";
import { t } from "@/i18n";
import type { License, LicenseStatus } from "@/lib/data/types";

type Action = { kind: "revoke" | "reset" | "extend" | "detail"; license: License } | null;
const PAGE = 8;

export function AdminLicenses({ licenses }: { licenses: License[] }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | LicenseStatus>("all");
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<Action>(null);
  const [days, setDays] = useState("30");
  const [daysErr, setDaysErr] = useState<string>();

  const rows = useMemo(() => licenses.filter((l) =>
    (status === "all" || l.status === status) &&
    (!q.trim() || `${l.id} ${l.key} ${l.planName} ${l.orderId}`.toLowerCase().includes(q.trim().toLowerCase()))
  ), [licenses, q, status]);
  const { slice, page: currentPage, pageCount } = paginate(rows, page, PAGE);
  const license = action?.license ?? null;

  function perform(kind: LicenseAdminAction, keyHash: string, addDays?: number) {
    startTransition(async () => {
      const result = await runLicenseAdminAction({ action: kind, keyHash, days: addDays });
      toast(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        setAction(null);
        router.refresh();
      }
    });
  }

  function displayKey(item: License) {
    return item.key.startsWith("คีย์เดิม") ? `แฮช ${item.id.slice(0, 10)}…` : maskKey(item.key);
  }

  return (
    <>
      <Card>
        <div className="grid gap-3 border-b border-line/10 p-4 sm:grid-cols-[1fr_200px]">
          <SearchInput label="ค้นหาไลเซนส์" placeholder="คีย์ แฮช แพ็กเกจ หรือคำสั่งซื้อ" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <ToolbarSelect label="สถานะ" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}>
            <option value="all">ทุกสถานะ</option>
            {(Object.keys(t.licenseStatus) as LicenseStatus[]).map((s) => <option key={s} value={s}>{t.licenseStatus[s]}</option>)}
          </ToolbarSelect>
        </div>
        {rows.length === 0 ? <EmptyState icon={KeyRound} title={t.common.noResults} description="ยังไม่พบไลเซนส์ตามเงื่อนไขที่เลือก" /> : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">ไลเซนส์ทั้งหมดในฐานข้อมูล</caption>
                <thead className="text-xs text-faint"><tr className="border-b border-line/10">
                  {["คีย์ / แฮช", "แพ็กเกจ", "สถานะ", "หมดอายุ", "อุปกรณ์ที่ผูก"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}
                  <th scope="col" className="px-4 py-3"><span className="sr-only">การจัดการ</span></th>
                </tr></thead>
                <tbody className="divide-y divide-line/10">
                  {slice.map((item) => <tr key={item.id} className="hover:bg-surface-2/50">
                    <td className="px-4 py-3.5 font-mono text-[13px]">{displayKey(item)}</td>
                    <td className="px-4 py-3.5">{item.planName}</td>
                    <td className="px-4 py-3.5"><LicenseStatusBadge status={item.status} /></td>
                    <td className="px-4 py-3.5 text-muted">{formatDate(item.expiresAt)}</td>
                    <td className="px-4 py-3.5 text-muted">{item.activations.length}/{item.maxBrowsers}</td>
                    <td className="px-4 py-3.5 text-right"><Button size="sm" variant="ghost" onClick={() => setAction({ kind: "detail", license: item })}>จัดการ</Button></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line/10 md:hidden">
              {slice.map((item) => <li key={item.id}>
                <button onClick={() => setAction({ kind: "detail", license: item })} className="flex w-full flex-col gap-2 px-4 py-4 text-left hover:bg-surface-2/50">
                  <span className="flex w-full items-center justify-between gap-3"><span className="font-mono text-[13px]">{displayKey(item)}</span><LicenseStatusBadge status={item.status} /></span>
                  <span className="text-sm text-muted">{item.planName} · หมดอายุ {formatDate(item.expiresAt)}</span>
                  <span className="text-xs text-faint">ผูกแล้ว {item.activations.length}/{item.maxBrowsers} อุปกรณ์</span>
                </button>
              </li>)}
            </ul>
            <Pagination page={currentPage} pageCount={pageCount} total={rows.length} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal open={action?.kind === "detail"} onClose={() => setAction(null)} variant="drawer" title={license ? `ไลเซนส์ ${license.planName}` : ""} description="การเปลี่ยนแปลงจะบันทึกลง Supabase จริง">
        {license && <div className="space-y-6 text-sm">
          <div className="flex items-center gap-3"><LicenseStatusBadge status={license.status} /><span className="font-mono text-[13px] text-muted">{displayKey(license)}</span></div>
          <dl className="grid grid-cols-2 gap-3">
            <div><dt className="text-faint">เริ่มใช้งาน</dt><dd>{formatDate(license.purchasedAt)}</dd></div>
            <div><dt className="text-faint">หมดอายุ</dt><dd>{formatDate(license.expiresAt)}</dd></div>
            <div><dt className="text-faint">จำกัดบัญชี</dt><dd>{license.maxAccounts}</dd></div>
            <div><dt className="text-faint">จำกัดอุปกรณ์</dt><dd>{license.maxBrowsers}</dd></div>
            <div><dt className="text-faint">คำสั่งซื้อ</dt><dd className="break-all font-mono text-xs">{license.orderId}</dd></div>
            <div><dt className="text-faint">รหัสอ้างอิง</dt><dd className="font-mono text-xs">{license.id.slice(0, 12)}…</dd></div>
          </dl>
          <div>
            <h3 className="mb-2 font-medium">อุปกรณ์และบัญชีที่ผูกไว้ ({license.activations.length})</h3>
            {license.activations.length === 0 ? <p className="text-muted">ยังไม่มีการเปิดใช้งาน</p> : <ul className="space-y-2">{license.activations.map((item) => <li key={item.id} className="rounded-md border border-line/10 bg-surface-2 p-3"><p>{item.browserLabel}</p><p className="text-xs text-faint">แฮชบัญชี <span className="font-mono">{item.accountHashPrefix}</span> · ใช้ล่าสุด {formatDateTime(item.lastSeenAt)}</p></li>)}</ul>}
          </div>
          <div className="grid gap-2 border-t border-line/10 pt-5">
            <Button variant="secondary" disabled={pending || license.status === "revoked"} onClick={() => { setDays("30"); setDaysErr(undefined); setAction({ kind: "extend", license }); }}><CalendarPlus className="size-4" aria-hidden />ขยายอายุไลเซนส์</Button>
            <Button variant="secondary" disabled={pending || license.activations.length === 0} onClick={() => setAction({ kind: "reset", license })}><RotateCcw className="size-4" aria-hidden />รีเซ็ตการผูกอุปกรณ์</Button>
            <Button variant="danger" disabled={pending || license.status === "revoked"} onClick={() => setAction({ kind: "revoke", license })}><Ban className="size-4" aria-hidden />เพิกถอนไลเซนส์</Button>
          </div>
        </div>}
      </Modal>

      <ConfirmDialog open={action?.kind === "revoke"} onClose={() => setAction(license ? { kind: "detail", license } : null)} loading={pending} danger confirmLabel="เพิกถอนถาวร" title="เพิกถอนไลเซนส์นี้?" description="ไลเซนส์จะถูกปฏิเสธในการตรวจสอบครั้งต่อไป และจะไม่สามารถขยายอายุผ่านหน้านี้ได้" onConfirm={() => license && perform("revoke", license.id)} />
      <ConfirmDialog open={action?.kind === "reset"} onClose={() => setAction(license ? { kind: "detail", license } : null)} loading={pending} danger confirmLabel="รีเซ็ตการผูกอุปกรณ์" title="ล้างการเปิดใช้งานทั้งหมด?" description="รายการอุปกรณ์และบัญชีที่ผูกอยู่จะถูกลบ ลูกค้าต้องเปิดใช้งานใหม่ การกระทำนี้เขียนข้อมูลจริงลงฐานข้อมูล" onConfirm={() => license && perform("reset", license.id)} />

      <Modal open={action?.kind === "extend"} onClose={() => setAction(license ? { kind: "detail", license } : null)} title="ขยายอายุไลเซนส์" description="เพิ่มจากวันหมดอายุเดิม หากหมดอายุแล้วจะเริ่มนับจากวันนี้"
        footer={<><Button variant="ghost" disabled={pending} onClick={() => setAction(license ? { kind: "detail", license } : null)}>ยกเลิก</Button><Button loading={pending} onClick={() => { const n = Number(days); if (!Number.isInteger(n) || n < 1 || n > 3650) { setDaysErr("กรอกจำนวนวันเป็นจำนวนเต็ม 1–3650"); return; } setDaysErr(undefined); if (license) perform("extend", license.id, n); }}>ยืนยันการขยายอายุ</Button></>}>
        <TextField label="จำนวนวันที่เพิ่ม" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} error={daysErr} />
      </Modal>
    </>
  );
}
