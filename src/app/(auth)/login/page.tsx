import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/features/auth-forms";
export const metadata: Metadata = { title: "เข้าสู่ระบบ" };
export default function Page() { return <Suspense><LoginForm /></Suspense>; }
