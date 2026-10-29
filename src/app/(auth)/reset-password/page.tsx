import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/features/auth-forms";
export const metadata: Metadata = { title: "ตั้งรหัสผ่านใหม่" };
export default function Page() { return <ResetPasswordForm />; }
