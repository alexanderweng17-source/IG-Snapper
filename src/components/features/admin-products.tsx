"use client";
import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { Plan } from "@/lib/data/types";

interface Draft { name: string; days: string; price: string; visible: boolean }

export function AdminProducts({ plans }: { plans: Plan[] }) {
  const toast = useToast();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(plans.map((p) => [p.id, { name: p.name, days: String(p.durationDays), price: String(p.priceSatang / 100), visible: p.visible }])));
  const [errors, setErrors] = useState<Record<string, Partial<Record<keyof Draft, string>>>>({});
  const set = (id: string, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  function save(id: string) {
    const d = drafts[id]; const er: Partial<Record<keyof Draft, string>> = {};
    if (!d.name.trim()) er.name = "กรุณากรอกชื่อแพ็กเกจ";
    if (!Number.isInteger(Number(d.days)) || Number(d.days) < 1) er.days = "ต้องเป็นจำนวนวันที่มากกว่า 0";
    if (!(Number(d.price) >= 0) || d.price.trim() === "") er.price = "กรอกราคาเป็นตัวเลข";
    setErrors((e) => ({ ...e, [id]: er })); if (Object.keys(er).length) return;
    toast("บันทึกแพ็กเกจ (จำลอง) — ยังไม่มีข้อมูลถูกเปลี่ยนแปลงจริง", "info");
  }

  return (
    <div className="space-y-5">
      {plans.map((p) => {
        const d = drafts[p.id]; const er = errors[p.id] ?? {};
        return (
          <Card key={p.id}>
            <CardBody>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2"><h2 className="font-semibold">ไลเซนส์ {p.name}</h2>{p.isPlaceholderPrice && <Badge tone="warning">ราคาตัวอย่าง</Badge>}</div>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <span className="text-muted">{d.visible ? "แสดงในหน้าราคา" : "ซ่อนจากหน้าราคา"}</span>
                  <input type="checkbox" role="switch" checked={d.visible} onChange={(e) => set(p.id, { visible: e.target.checked })}
                    className="h-6 w-11 cursor-pointer appearance-none rounded-full bg-surface-3 transition-colors checked:bg-accent relative before:absolute before:left-0.5 before:top-0.5 before:size-5 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-5" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField label="ชื่อแพ็กเกจ" value={d.name} onChange={(e) => set(p.id, { name: e.target.value })} error={er.name} />
                <TextField label="ระยะเวลา (วัน)" inputMode="numeric" value={d.days} onChange={(e) => set(p.id, { days: e.target.value })} error={er.days} />
                <TextField label="ราคาที่แสดง (บาท)" inputMode="decimal" value={d.price} onChange={(e) => set(p.id, { price: e.target.value })} error={er.price} />
              </div>
              <div className="mt-4 flex justify-end"><Button onClick={() => save(p.id)}>บันทึก (จำลอง)</Button></div>
            </CardBody>
          </Card>
        );
      })}
      <p className="text-sm text-faint">ราคาที่แสดงบนเว็บไซต์ต้องตรงกับราคาที่กำหนดใน Stripe เมื่อเชื่อมต่อจริง ระบบหลังบ้านต้องเป็นผู้กำหนดราคาที่ชำระ ไม่ใช่เบราว์เซอร์</p>
    </div>
  );
}
