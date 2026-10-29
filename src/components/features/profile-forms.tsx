"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProfileForms({ name: initialName, email }: { name: string; email: string }) {
  const toast = useToast(); const router = useRouter();
  const [name, setName] = useState(initialName); const [nameErr, setNameErr] = useState<string>();
  const [savingName, setSavingName] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" }); const [pwErr, setPwErr] = useState<Record<string, string>>({});
  const [savingPw, setSavingPw] = useState(false); const [signOut, setSignOut] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setNameErr("กรุณากรอกชื่อ"); return; }
    setNameErr(undefined); setSavingName(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
      if (error) throw error;
      toast("บันทึกชื่อแล้ว", "success"); router.refresh();
    } catch (err) { toast(err instanceof Error ? err.message : "บันทึกชื่อไม่สำเร็จ", "error"); }
    finally { setSavingName(false); }
  }
  async function savePw(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!pw.current) er.current = "กรุณากรอกรหัสผ่านปัจจุบัน";
    if (pw.next.length < 8) er.next = "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร";
    if (pw.confirm !== pw.next) er.confirm = "รหัสผ่านไม่ตรงกัน";
    setPwErr(er); if (Object.keys(er).length) return;
    setSavingPw(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: checkError } = await supabase.auth.signInWithPassword({ email, password: pw.current });
      if (checkError) throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");
      const { error } = await supabase.auth.updateUser({ password: pw.next });
      if (error) throw error;
      setPw({ current: "", next: "", confirm: "" });
      toast("เปลี่ยนรหัสผ่านแล้ว", "success");
    } catch (err) { toast(err instanceof Error ? err.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ", "error"); }
    finally { setSavingPw(false); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader title="ข้อมูลส่วนตัว" />
        <CardBody>
          <form onSubmit={saveName} noValidate className="space-y-4">
            <TextField label="ชื่อ" value={name} onChange={(e) => setName(e.target.value)} error={nameErr} autoComplete="name" />
            <TextField label="อีเมล" value={email} readOnly disabled hint="การเปลี่ยนอีเมลจะรองรับเมื่อเชื่อมต่อระบบยืนยันตัวตน" />
            <Button type="submit" loading={savingName}>บันทึกการเปลี่ยนแปลง</Button>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="รหัสผ่านและความปลอดภัย" />
        <CardBody>
          <form onSubmit={savePw} noValidate className="space-y-4">
            <PasswordField label="รหัสผ่านปัจจุบัน" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} error={pwErr.current} />
            <PasswordField label="รหัสผ่านใหม่" autoComplete="new-password" hint="อย่างน้อย 8 ตัวอักษร" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} error={pwErr.next} />
            <PasswordField label="ยืนยันรหัสผ่านใหม่" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErr.confirm} />
            <Button type="submit" loading={savingPw}>เปลี่ยนรหัสผ่าน</Button>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="ออกจากระบบ" description="ออกจากระบบบนอุปกรณ์นี้" />
        <CardBody><Button variant="secondary" onClick={() => setSignOut(true)}><LogOut className="size-4" aria-hidden />ออกจากระบบ</Button></CardBody>
      </Card>
      <ConfirmDialog open={signOut} onClose={() => setSignOut(false)} title="ออกจากระบบ?" description="คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อใช้งานไลเซนส์และคำสั่งซื้อ" confirmLabel="ออกจากระบบ"
        onConfirm={async () => { setSignOut(false); try { const supabase = createSupabaseBrowserClient(); await supabase.auth.signOut(); } finally { router.replace("/login"); router.refresh(); } }} />
    </div>
  );
}
