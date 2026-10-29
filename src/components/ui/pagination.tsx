"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export function Pagination({ page, pageCount, total, onPage }: { page: number; pageCount: number; total: number; onPage: (p: number) => void }) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line/10 px-4 py-3 text-sm text-muted">
      <p>ทั้งหมด {total} รายการ · หน้า {page} / {pageCount}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="หน้าก่อนหน้า"><ChevronLeft className="size-4" /></Button>
        <Button size="sm" variant="secondary" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="หน้าถัดไป"><ChevronRight className="size-4" /></Button>
      </div>
    </div>
  );
}

/** Tiny client-side paging helper. */
export function paginate<T>(items: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(page, pageCount);
  return { slice: items.slice((p - 1) * size, p * size), page: p, pageCount };
}
