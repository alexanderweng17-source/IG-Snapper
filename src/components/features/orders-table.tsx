"use client";
import { useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Pagination, paginate } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ToolbarSelect } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { formatDate, formatDateTime, formatTHB } from "@/lib/utils";
import { t } from "@/i18n";
import type { Order, PaymentStatus } from "@/lib/data/types";

const methodLabel = { promptpay: "PromptPay", card: "บัตร" } as const;
const PAGE = 6;

export function OrdersTable({ orders, admin = false }: { orders: Order[]; admin?: boolean }) {
  const [q, setQ] = useState(""); const [status, setStatus] = useState<"all" | PaymentStatus>("all");
  const [sort, setSort] = useState<"new" | "old" | "high" | "low">("new"); const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Order | null>(null);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    const f = orders.filter((o) => (status === "all" || o.paymentStatus === status) && (!n || `${o.number} ${o.planName} ${o.customerEmail ?? ""}`.toLowerCase().includes(n)));
    return f.sort((a, b) => sort === "new" ? +new Date(b.createdAt) - +new Date(a.createdAt) : sort === "old" ? +new Date(a.createdAt) - +new Date(b.createdAt) : sort === "high" ? b.amountSatang - a.amountSatang : a.amountSatang - b.amountSatang);
  }, [orders, q, status, sort]);
  const { slice, page: p, pageCount } = paginate(rows, page, PAGE);

  return (
    <Card>
      <div className="grid gap-3 border-b border-line/10 p-4 sm:grid-cols-[1fr_auto_auto]">
        <SearchInput label="ค้นหาคำสั่งซื้อ" placeholder={admin ? "ค้นหาเลขที่คำสั่งซื้อ อีเมล หรือแพ็กเกจ" : "ค้นหาเลขที่คำสั่งซื้อหรือแพ็กเกจ"} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <ToolbarSelect label="กรองตามสถานะการชำระเงิน" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}>
          <option value="all">ทุกสถานะ</option>
          {(Object.keys(t.paymentStatus) as PaymentStatus[]).map((s) => <option key={s} value={s}>{t.paymentStatus[s]}</option>)}
        </ToolbarSelect>
        <ToolbarSelect label="เรียงลำดับ" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="new">ใหม่สุดก่อน</option><option value="old">เก่าสุดก่อน</option><option value="high">ราคาสูง → ต่ำ</option><option value="low">ราคาต่ำ → สูง</option>
        </ToolbarSelect>
      </div>

      {rows.length === 0 ? <EmptyState icon={ReceiptText} title={orders.length ? t.common.noResults : "ยังไม่มีคำสั่งซื้อ"} description={orders.length ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เมื่อคุณซื้อไลเซนส์ คำสั่งซื้อจะแสดงที่นี่"} /> : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">รายการคำสั่งซื้อ</caption>
              <thead className="text-xs text-faint"><tr className="border-b border-line/10">
                <th scope="col" className="px-4 py-3 font-medium">เลขที่</th>{admin && <th scope="col" className="px-4 py-3 font-medium">ลูกค้า</th>}<th scope="col" className="px-4 py-3 font-medium">แพ็กเกจ</th><th scope="col" className="px-4 py-3 font-medium">วันที่</th><th scope="col" className="px-4 py-3 text-right font-medium">ยอดรวม</th><th scope="col" className="px-4 py-3 font-medium">สถานะ</th><th scope="col" className="px-4 py-3"><span className="sr-only">การกระทำ</span></th>
              </tr></thead>
              <tbody className="divide-y divide-line/10">
                {slice.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-2/50">
                    <td className="px-4 py-3.5 font-mono text-[13px]">{o.number}</td>
                    {admin && <td className="px-4 py-3.5 text-muted">{o.customerEmail}</td>}
                    <td className="px-4 py-3.5">{o.planName}</td>
                    <td className="px-4 py-3.5 text-muted">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums">{formatTHB(o.amountSatang)}</td>
                    <td className="px-4 py-3.5"><PaymentStatusBadge status={o.paymentStatus} /></td>
                    <td className="px-4 py-3.5 text-right"><Button size="sm" variant="ghost" onClick={() => setSel(o)} aria-label={`ดูรายละเอียด ${o.number}`}>{t.common.details}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <ul className="divide-y divide-line/10 md:hidden">
            {slice.map((o) => (
              <li key={o.id}>
                <button onClick={() => setSel(o)} className="flex w-full flex-col gap-2 px-4 py-4 text-left hover:bg-surface-2/50">
                  <span className="flex items-center justify-between gap-3"><span className="font-mono text-[13px]">{o.number}</span><PaymentStatusBadge status={o.paymentStatus} /></span>
                  <span className="flex items-center justify-between text-sm"><span>ไลเซนส์ {o.planName}</span><span className="tabular-nums">{formatTHB(o.amountSatang)}</span></span>
                  <span className="text-xs text-faint">{formatDate(o.createdAt)}{admin && ` · ${o.customerEmail}`}</span>
                </button>
              </li>
            ))}
          </ul>
          <Pagination page={p} pageCount={pageCount} total={rows.length} onPage={setPage} />
        </>
      )}

      <Modal open={!!sel} onClose={() => setSel(null)} variant="drawer" title={sel ? `คำสั่งซื้อ ${sel.number}` : ""} description="รายละเอียดคำสั่งซื้อจากฐานข้อมูล">
        {sel && (
          <dl className="space-y-4 text-sm">
            {([
              ["สถานะการชำระเงิน", <PaymentStatusBadge key="s" status={sel.paymentStatus} />],
              ["แพ็กเกจ", `ไลเซนส์ ${sel.planName}`],
              ["ยอดรวม", formatTHB(sel.amountSatang)],
              ["วิธีชำระเงิน", sel.paymentMethod ? methodLabel[sel.paymentMethod] : "—"],
              ["สร้างเมื่อ", formatDateTime(sel.createdAt)],
              ...(admin ? [["ลูกค้า", sel.customerEmail ?? "—"]] : []),
              ["ไลเซนส์ที่ออกให้", sel.licenseId ? sel.licenseId : sel.paymentStatus === "pending" ? "รอยืนยันการชำระเงิน" : "ไม่มี"],
            ] as [string, React.ReactNode][]).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 border-b border-line/10 pb-3"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>
            ))}
          </dl>
        )}
      </Modal>
    </Card>
  );
}
