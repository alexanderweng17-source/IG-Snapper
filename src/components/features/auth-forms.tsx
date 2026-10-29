"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { isEmail, safeNext } from "@/lib/validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function Shell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line/10 bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
      <div className="mt-6">{children}</div>
      <div className="mt-6 border-t border-line/10 pt-5 text-center text-sm text-muted">{footer}</div>
    </div>
  );
}

type Errors = Partial<Record<"email" | "password" | "confirm" | "name", string>>;

export function LoginForm() {
  const router = useRouter(); const sp = useSearchParams(); const toast = useToast();
  const next = safeNext(sp.get("next"));
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({}); const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Errors = {};
    if (!email.trim()) er.email = "กรุณากรอกอีเมล"; else if (!isEmail(email)) er.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!password) er.password = "กรุณากรอกรหัสผ่าน";
    setErrors(er); setFormError(""); if (Object.keys(er).length) return;
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      toast("เข้าสู่ระบบสำเร็จ", "success");
      router.replace(next); router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "เข้าสู่ระบบไม่สำเร็จ ตรวจสอบการตั้งค่าและข้อมูลของคุณ");
    } finally { setLoading(false); }
  }
  return (
    <Shell title="เข้าสู่ระบบ" subtitle="เข้าสู่ระบบเพื่อดูไลเซนส์และคำสั่งซื้อของคุณ"
      footer={<>ยังไม่มีบัญชี? <Link href={`/register${sp.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-accent hover:underline">สมัครสมาชิก</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{formError}</p>}
        <TextField label="อีเมล" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="name@example.com" />
        <PasswordField label="รหัสผ่าน" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <div className="text-right text-sm"><Link href="/forgot-password" className="text-accent hover:underline">ลืมรหัสผ่าน?</Link></div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>{loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}</Button>
      </form>
    </Shell>
  );
}

export function RegisterForm() {
  const router = useRouter(); const sp = useSearchParams(); const toast = useToast();
  const next = safeNext(sp.get("next"));
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({}); const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(""); const [confirmation, setConfirmation] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Errors = {};
    if (!f.name.trim()) er.name = "กรุณากรอกชื่อ";
    if (!f.email.trim()) er.email = "กรุณากรอกอีเมล"; else if (!isEmail(f.email)) er.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (f.password.length < 8) er.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    if (f.confirm !== f.password) er.confirm = "รหัสผ่านไม่ตรงกัน";
    if (!acceptedPolicies) setFormError("กรุณาอ่านและยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัวก่อนสมัครสมาชิก");
    setErrors(er); setFormError(""); if (Object.keys(er).length) return;
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { data, error } = await supabase.auth.signUp({
        email: f.email.trim(), password: f.password,
        options: { data: { full_name: f.name.trim() }, emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      if (data.session) {
        toast("สร้างบัญชีสำเร็จ", "success"); router.replace(next); router.refresh();
      } else {
        setConfirmation(true);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่");
    } finally { setLoading(false); }
  }
  if (confirmation) return (
    <Shell title="ตรวจสอบอีเมลของคุณ" subtitle="อีกขั้นตอนเดียวก็พร้อมใช้งานแล้ว"
      footer={<Link href="/login" className="text-accent hover:underline">กลับไปเข้าสู่ระบบ</Link>}>
      <div role="status" className="space-y-3 text-center"><MailCheck className="mx-auto size-10 text-success" aria-hidden /><p className="font-medium">ส่งลิงก์ยืนยันไปที่ {f.email}</p><p className="text-sm text-muted">เปิดอีเมลแล้วกดลิงก์ยืนยันเพื่อเปิดใช้งานบัญชี</p><Button variant="secondary" onClick={() => setConfirmation(false)}><CheckCircle2 className="size-4" aria-hidden />ใช้ข้อมูลอีเมลอื่น</Button></div>
    </Shell>
  );
  return (
    <Shell title="สร้างบัญชี" subtitle="สมัครสมาชิกเพื่อซื้อและจัดการไลเซนส์"
      footer={<>มีบัญชีอยู่แล้ว? <Link href={`/login${sp.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-accent hover:underline">เข้าสู่ระบบ</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{formError}</p>}
        <TextField label="ชื่อ" autoComplete="name" value={f.name} onChange={set("name")} error={errors.name} />
        <TextField label="อีเมล" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={set("email")} error={errors.email} placeholder="name@example.com" />
        <PasswordField label="รหัสผ่าน" autoComplete="new-password" hint="อย่างน้อย 8 ตัวอักษร" value={f.password} onChange={set("password")} error={errors.password} />
        <PasswordField label="ยืนยันรหัสผ่าน" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} error={errors.confirm} />
        <label className="flex items-start gap-3 rounded-lg border border-line/10 bg-surface-2/40 p-3 text-sm text-muted"><input type="checkbox" checked={acceptedPolicies} onChange={(e) => setAcceptedPolicies(e.target.checked)} required className="mt-1 size-4 shrink-0 accent-[rgb(var(--accent))]" /><span>ฉันได้อ่านและยอมรับ <Link href="/legal/terms" target="_blank" className="text-accent underline underline-offset-2">ข้อกำหนดการใช้งาน</Link> และรับทราบ <Link href="/legal/privacy" target="_blank" className="text-accent underline underline-offset-2">นโยบายความเป็นส่วนตัว</Link> แล้ว</span></label>
        <Button type="submit" size="lg" className="w-full" loading={loading}>{loading ? "กำลังสร้างบัญชี…" : "สร้างบัญชี"}</Button>
      </form>
    </Shell>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState(""); const [error, setError] = useState<string>(); const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) { setError(email.trim() ? "รูปแบบอีเมลไม่ถูกต้อง" : "กรุณากรอกอีเมล"); return; }
    setError(undefined); setFormError(""); setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) { setFormError(err instanceof Error ? err.message : "ส่งลิงก์กู้คืนไม่สำเร็จ"); }
    finally { setLoading(false); }
  }
  return (
    <Shell title="กู้คืนรหัสผ่าน" subtitle="กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่" footer={<Link href="/login" className="text-accent hover:underline">← กลับไปเข้าสู่ระบบ</Link>}>
      {sent ? (
        <div role="status" className="space-y-3 text-center"><MailCheck className="mx-auto size-10 text-success" aria-hidden /><p className="font-medium">หากอีเมลนี้ลงทะเบียนไว้ คุณจะได้รับลิงก์กู้คืน</p><p className="text-sm text-muted">กรุณาตรวจกล่องจดหมายและโฟลเดอร์สแปม</p></div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          {formError && <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{formError}</p>}
          <TextField label="อีเมล" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} placeholder="name@example.com" />
          <Button type="submit" size="lg" className="w-full" loading={loading}>{loading ? "กำลังดำเนินการ…" : "ส่งลิงก์กู้คืนรหัสผ่าน"}</Button>
        </form>
      )}
    </Shell>
  );
}

export function ResetPasswordForm() {
  const router = useRouter(); const toast = useToast();
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
    if (password !== confirm) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    setError(""); setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      toast("เปลี่ยนรหัสผ่านแล้ว", "success"); router.replace("/dashboard"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ"); }
    finally { setLoading(false); }
  }
  return <Shell title="ตั้งรหัสผ่านใหม่" subtitle="ตั้งรหัสผ่านใหม่สำหรับบัญชี IG Snapper" footer={<Link href="/login" className="text-accent hover:underline">กลับไปเข้าสู่ระบบ</Link>}>
    <form onSubmit={submit} className="space-y-4">
      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      <PasswordField label="รหัสผ่านใหม่" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <PasswordField label="ยืนยันรหัสผ่านใหม่" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <Button type="submit" size="lg" className="w-full" loading={loading}>บันทึกรหัสผ่านใหม่</Button>
    </form>
  </Shell>;
}
