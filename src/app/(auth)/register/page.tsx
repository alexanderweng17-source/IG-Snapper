import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/features/auth-forms";
export const metadata: Metadata = { title: "สมัครสมาชิก" };
export default function Page() { return <Suspense><RegisterForm /></Suspense>; }
