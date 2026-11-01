import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser, isAdminEmail } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function hasActivePurchasedLicense(userId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data: orders, error: orderError } = await admin
    .from("web_orders")
    .select("license_key_hash")
    .eq("user_id", userId)
    .eq("payment_status", "paid")
    .not("license_key_hash", "is", null);

  if (orderError) throw orderError;
  const hashes = [...new Set((orders ?? []).map((row) => row.license_key_hash).filter((value): value is string => Boolean(value)))];
  if (!hashes.length) return false;

  const { data: licenses, error: licenseError } = await admin
    .from("licenses")
    .select("status,expires_at")
    .in("key_hash", hashes);

  if (licenseError) throw licenseError;
  const now = Date.now();
  return (licenses ?? []).some((license) =>
    license.status === "active" &&
    (!license.expires_at || new Date(license.expires_at).getTime() > now)
  );
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=%2Fdownload", request.url));
  }

  try {
    const allowed = isAdminEmail(user.email) || await hasActivePurchasedLicense(user.id);
    if (!allowed) return NextResponse.redirect(new URL("/pricing?download=license-required", request.url));

    const filePath = path.join(process.cwd(), "releases", "v2.3.3", "chrome", "IG-Snapper-v2.3.3-customer.zip");
    const file = await readFile(filePath);
    return new Response(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(file.byteLength),
        "Content-Disposition": `attachment; filename="IG-Snapper-v2.3.3-customer.zip"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Protected Chrome package download failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "ไม่สามารถดาวน์โหลดไฟล์ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง" }, { status: 503 });
  }
}
