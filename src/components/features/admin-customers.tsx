"use client";
import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/states";
import { formatDate, formatTHB } from "@/lib/utils";
import { t } from "@/i18n";
import type { Customer } from "@/lib/data/types";

export function AdminCustomers({ customers }: { customers: Customer[] }) {
  const [q, setQ] = useState(""); const [sel, setSel] = useState<Customer | null>(null);
  const rows = useMemo(() => customers.filter((c) => !q.trim() || `${c.name} ${c.email}`.toLowerCase().includes(q.trim().toLowerCase())), [customers, q]);
  return (
    <Card>
      <div className="border-b border-line/10 p-4"><SearchInput label="ค้นหาลูกค้า" placeholder="ค้นหาชื่อหรืออีเมล" value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-sm" /></div>
      {rows.length === 0 ? <EmptyState icon={Users} title={t.common.noResults} /> : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">รายชื่อลูกค้า</caption>
              <thead className="text-xs text-faint"><tr className="border-b border-line/10">{["ชื่อ", "อีเมล", "สมัครเมื่อ", "คำสั่งซื้อ", "ไลเซนส์ที่ใช้งานได้", "ยอดชำระรวม"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}<th scope="col" className="px-4 py-3"><span className="sr-only">การกระทำ</span></th></tr></thead>
              <tbody className="divide-y divide-line/10">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-2/50"><td className="px-4 py-3.5 font-medium">{c.name}</td><td className="px-4 py-3.5 text-muted">{c.email}</td><td className="px-4 py-3.5 text-muted">{formatDate(c.joinedAt)}</td><td className="px-4 py-3.5">{c.orders}</td><td className="px-4 py-3.5">{c.activeLicenses}</td><td className="px-4 py-3.5 tabular-nums">{formatTHB(c.totalSpentSatang)}</td>
                    <td className="px-4 py-3.5 text-right"><Button size="sm" variant="ghost" onClick={() => setSel(c)}>{t.common.details}</Button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-line/10 md:hidden">
            {rows.map((c) => <li key={c.id}><button onClick={() => setSel(c)} className="w-full px-4 py-4 text-left hover:bg-surface-2/50"><p className="font-medium">{c.name}</p><p className="text-sm text-muted">{c.email}</p><p className="mt-1 text-xs text-faint">{c.orders} คำสั่งซื้อ · {c.activeLicenses} ไลเซนส์ที่ใช้งานได้</p></button></li>)}
          </ul>
        </>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} variant="drawer" title={sel?.name ?? ""} description={sel?.email}>
        {sel && <dl className="space-y-3 text-sm">{([["สมัครเมื่อ", formatDate(sel.joinedAt)], ["คำสั่งซื้อทั้งหมด", String(sel.orders)], ["ไลเซนส์ที่ใช้งานได้", String(sel.activeLicenses)], ["ยอดชำระรวม", formatTHB(sel.totalSpentSatang)]] as const).map(([k, v]) => <div key={k} className="flex justify-between border-b border-line/10 pb-3"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>)}<p className="pt-2 text-xs text-faint">ยอดใช้จ่ายคำนวณจากคำสั่งซื้อที่ชำระเงินสำเร็จ</p></dl>}
      </Modal>
    </Card>
  );
}
