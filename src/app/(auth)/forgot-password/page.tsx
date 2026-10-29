import type { Metadata } from "next";
import { ForgotForm } from "@/components/features/auth-forms";
export const metadata: Metadata = { title: "กู้คืนรหัสผ่าน" };
export default function Page() { return <ForgotForm />; }
