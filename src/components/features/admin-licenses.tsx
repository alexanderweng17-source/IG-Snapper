"use client";
import { useMemo, useState } from "react";
import { Ban, CalendarPlus, KeyRound, Plus, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LicenseStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { SelectField, TextField, ToolbarSelect } from "@/components/ui/field";
import { Pagination, paginate } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatDateTime } from "@/lib/utils";
import { maskKey } from "@/components/ui/license-key";
import { t } from "@/i18n";
import type { License, LicenseStatus, Plan } from "@/lib/data/types";

type Action = { kind: "revoke" | "reset" | "extend" | "detail"; license: License } | { kind: "issue" } | null;
const PAGE = 6;

/**
 * UI PROTOTYPE. None of these actions change data. In production each action must call a
 * server endpoint that verifies the caller is an admin and writes an audit-log entry.
 * Keys are NEVER generated in the browser.
 */
export function AdminLicenses({ licenses, plans }: { licenses: License[]; plans: Plan[] }) {
  const toast = useToast();
  const [q, setQ] = useState(""); const [status, setStatus] = useState<"all" | LicenseStatus>("all"); const [page, setPage] = useState(1);
  const [action, setAction] = useState<Action>(null);
  const [days, setDays] = useState("30"); const [daysErr, setDaysErr] = useState<string>();
  const [email, setEmail] = useState(""); const [emailErr, setEmailErr] = useState<string>();

  const rows = useMemo(() => licenses.filter((l) => (status === "all" || l.status === status) && (!q.trim() || `${l.key} ${l.planName} ${l.orderId}`.toLowerCase().includes(q.trim().toLowerCase()))), [licenses, q, status]);
  const { slice, page: p, pageCount } = paginate(rows, page, PAGE);
  const done = (msg: string) => { setAction(null); toast(`${msg} (${t.common.simulated}) — ${t.demo.actionSimulated}`, "info"); };
  const lic = action && "license" in action ? action.license : null;

  return (
    <>
      <Card>
        <div className="grid gap-3 border-b border-line/10 p-4 sm:grid-cols-[1fr_190px_auto]">
          <SearchInput label="ค้นหาไลเซนส์" placeholder="ค้นหาคีย์ แพ็กเกจ หรือคำสั่งซื้อ" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <ToolbarSelect label="กรองตามสถานะ" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}>
            <option value="all">ทุกสถานะ</option>
            {(Object.keys(t.licenseStatus) as LicenseStatus[]).map((s) => <option key={s} value={s}>{t.licenseStatus[s]}</option>)}
          </ToolbarSelect>
          <Button onClick={() => setAction({ kind: "issue" })}><Plus className="size-4" aria-hidden />ออกไลเซนส์</Button>
        </div>
        {rows.length === 0 ? <EmptyState icon={KeyRound} title={t.common.noResults} /> : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">รายการไลเซนส์ทั้งหมด</caption>
                <thead className="text-xs text-faint"><tr className="border-b border-line/10">
                  {["คีย์ (ปิดบังบางส่วน)", "แพ็กเกจ", "สถานะ", "หมดอายุ", "เปิดใช้งาน"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}<th scope="col" className="px-4 py-3"><span className="sr-only">การกระทำ</span></th>
                </tr></thead>
                <tbody className="divide-y divide-line/10">
                  {slice.map((l) => (
                    <tr key={l.id} className="hover:bg-surface-2/50">
                      <td className="px-4 py-3.5 font-mono text-[13px]">{maskKey(l.key)}</td><td className="px-4 py-3.5">{l.planName}</td>
                      <td className="px-4 py-3.5"><LicenseStatusBadge status={l.status} /></td><td className="px-4 py-3.5 text-muted">{formatDate(l.expiresAt)}</td>
                      <td className="px-4 py-3.5 text-muted">{l.activations.length}/{l.maxBrowsers}</td>
                      <td className="px-4 py-3.5 text-right"><Button size="sm" variant="ghost" onClick={() => setAction({ kind: "detail", license: l })}>จัดการ</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line/10 md:hidden">
              {slice.map((l) => (
                <li key={l.id}><button onClick={() => setAction({ kind: "detail", license: l })} className="flex w-full flex-col gap-2 px-4 py-4 text-left hover:bg-surface-2/50">
                  <span className="flex items-center justify-between gap-2"><span className="font-mono text-[13px]">{maskKey(l.key)}</span><LicenseStatusBadge status={l.status} /></span>
                  <span className="text-sm text-muted">ไลเซนส์ {l.planName} · หมดอายุ {formatDate(l.expiresAt)} · เปิดใช้งาน {l.activations.length}/{l.maxBrowsers}</span>
                </button></li>
              ))}
            </ul>
            <Pagination page={p} pageCount={pageCount} total={rows.length} onPage={setPage} />
          </>
        )}
      </Card>

      {/* Detail / actions drawer */}
      <Modal open={action?.kind === "detail"} onClose={() => setAction(null)} variant="drawer" title={lic ? `ไลเซนส์ ${lic.planName}` : ""} description="ข้อมูลตัวอย่าง · การกระทำเป็นการจำลอง">
        {lic && (
          <div className="space-y-6 text-sm">
            <div className="flex items-center gap-3"><LicenseStatusBadge status={lic.status} /><span className="font-mono text-[13px] text-muted">{maskKey(lic.key)}</span></div>
            <dl className="grid grid-cols-2 gap-3">
              <div><dt className="text-faint">ซื้อเมื่อ</dt><dd>{formatDate(lic.purchasedAt)}</dd></div><div><dt className="text-faint">หมดอายุ</dt><dd>{formatDate(lic.expiresAt)}</dd></div>
              <div><dt className="text-faint">จำกัดบัญชี</dt><dd>{lic.maxAccounts}</dd></div><div><dt className="text-faint">จำกัดเบราว์เซอร์</dt><dd>{lic.maxBrowsers}</dd></div>
            </dl>
            <div>
              <h3 className="mb-2 font-medium">การเปิดใช้งาน ({lic.activations.length})</h3>
              {lic.activations.length === 0 ? <p className="text-muted">ยังไม่มี</p> : <ul className="space-y-2">{lic.activations.map((a) => <li key={a.id} className="rounded-md border border-line/10 bg-surface-2 p-3"><p>{a.browserLabel}</p><p className="text-xs text-faint">แฮชบัญชี <span className="font-mono">{a.accountHashPrefix}</span> · ล่าสุด {formatDateTime(a.lastSeenAt)}</p></li>)}</ul>}
            </div>
            <div className="grid gap-2 border-t border-line/10 pt-5">
              <Button variant="secondary" onClick={() => setAction({ kind: "extend", license: lic })}><CalendarPlus className="size-4" aria-hidden />ขยายอายุไลเซนส์</Button>
              <Button variant="secondary" onClick={() => setAction({ kind: "reset", license: lic })} disabled={lic.activations.length === 0}><RotateCcw className="size-4" aria-hidden />รีเซ็ตการเปิดใช้งาน</Button>
              <Button variant="danger" onClick={() => setAction({ kind: "revoke", license: lic })} disabled={lic.status === "revoked"}><Ban className="size-4" aria-hidden />เพิกถอนไลเซนส์</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={action?.kind === "revoke"} onClose={() => setAction(lic ? { kind: "detail", license: lic } : null)} danger confirmLabel="เพิกถอนไลเซนส์" title="เพิกถอนไลเซนส์นี้?"
        description="คีย์จะใช้งานไม่ได้ในการตรวจสอบครั้งถัดไปของส่วนขยาย การกระทำนี้ควรบันทึกใน audit log เมื่อเชื่อมต่อระบบจริง" onConfirm={() => done("เพิกถอนไลเซนส์")} />
      <ConfirmDialog open={action?.kind === "reset"} onClose={() => setAction(lic ? { kind: "detail", license: lic } : null)} danger confirmLabel="รีเซ็ตการเปิดใช้งาน" title="รีเซ็ตการเปิดใช้งาน?"
        description="อุปกรณ์/บัญชีที่ผูกกับคีย์นี้จะถูกล้าง ผู้ใช้ต้องเปิดใช้งานใหม่" onConfirm={() => done("รีเซ็ตการเปิดใช้งาน")} />
      <Modal open={action?.kind === "extend"} onClose={() => setAction(lic ? { kind: "detail", license: lic } : null)} title="ขยายอายุไลเซนส์"
        footer={<><Button variant="ghost" onClick={() => setAction(lic ? { kind: "detail", license: lic } : null)}>ยกเลิก</Button><Button onClick={() => { const n = Number(days); if (!Number.isInteger(n) || n < 1 || n > 3650) { setDaysErr("กรอกจำนวนวันเป็นจำนวนเต็ม 1–3650"); return; } setDaysErr(undefined); done(`ขยายอายุ ${n} วัน`); }}>ยืนยัน</Button></>}>
        <TextField label="จำนวนวันที่ต้องการเพิ่ม" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} error={daysErr} />
      </Modal>
      <Modal open={action?.kind === "issue"} onClose={() => setAction(null)} title="ออกไลเซนส์ให้ลูกค้า" description="ระบบหลังบ้านจะเป็นผู้สร้างคีย์ ไม่ใช่เบราว์เซอร์"
        footer={<><Button variant="ghost" onClick={() => setAction(null)}>ยกเลิก</Button><Button onClick={() => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setEmailErr("กรุณากรอกอีเมลลูกค้าให้ถูกต้อง"); return; } setEmailErr(undefined); done("ออกไลเซนส์"); }}>ออกไลเซนส์</Button></>}>
        <div className="space-y-4">
          <TextField label="อีเมลลูกค้า" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailErr} />
          <SelectField label="แพ็กเกจ">{plans.map((p) => <option key={p.id}>{p.name}</option>)}</SelectField>
        </div>
      </Modal>
    </>
  );
}
