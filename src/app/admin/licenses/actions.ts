"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type LicenseAdminAction = "revoke" | "reset" | "extend";

export async function runLicenseAdminAction(input: {
  action: LicenseAdminAction;
  keyHash: string;
  days?: number;
}): Promise<{ ok: boolean; message: string }> {
  const actor = await requireAdminUser();
  if (!/^[a-f0-9]{64}$/i.test(input.keyHash)) {
    return { ok: false, message: "รหัสไลเซนส์ไม่ถูกต้อง" };
  }
  if (!["revoke", "reset", "extend"].includes(input.action)) {
    return { ok: false, message: "ไม่รองรับการกระทำนี้" };
  }

  const admin = createSupabaseAdminClient();
  const { data: license, error: lookupError } = await admin
    .from("licenses")
    .select("key_hash,status,expires_at")
    .eq("key_hash", input.keyHash.toLowerCase())
    .maybeSingle();

  if (lookupError) {
    console.error("Admin license lookup failed", lookupError);
    return { ok: false, message: "ตรวจสอบไลเซนส์ไม่สำเร็จ โปรดลองอีกครั้ง" };
  }
  if (!license) return { ok: false, message: "ไม่พบไลเซนส์นี้ในระบบ" };

  if (input.action === "revoke") {
    if (license.status === "revoked") return { ok: false, message: "ไลเซนส์นี้ถูกเพิกถอนอยู่แล้ว" };
    const { error } = await admin.from("licenses").update({ status: "revoked" }).eq("key_hash", license.key_hash);
    if (error) {
      console.error("Admin license revoke failed", error);
      return { ok: false, message: "เพิกถอนไลเซนส์ไม่สำเร็จ" };
    }
  } else if (input.action === "reset") {
    const { error } = await admin.from("license_activations").delete().eq("key_hash", license.key_hash);
    if (error) {
      console.error("Admin license activation reset failed", error);
      return { ok: false, message: "รีเซ็ตการเปิดใช้งานไม่สำเร็จ" };
    }
  } else {
    const days = input.days;
    if (!Number.isInteger(days) || !days || days < 1 || days > 3650) {
      return { ok: false, message: "จำนวนวันต้องเป็นจำนวนเต็มระหว่าง 1–3650" };
    }
    if (license.status === "revoked") {
      return { ok: false, message: "ไลเซนส์ที่ถูกเพิกถอนแล้วไม่สามารถขยายอายุได้" };
    }
    const now = Date.now();
    const expiry = license.expires_at ? new Date(license.expires_at).getTime() : 0;
    const base = Number.isFinite(expiry) && expiry > now ? expiry : now;
    const expiresAt = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await admin.from("licenses").update({ expires_at: expiresAt }).eq("key_hash", license.key_hash);
    if (error) {
      console.error("Admin license extension failed", error);
      return { ok: false, message: "ขยายอายุไลเซนส์ไม่สำเร็จ" };
    }
  }

  console.info("admin_license_action", {
    action: input.action,
    keyHashPrefix: license.key_hash.slice(0, 8),
    actorId: actor.id,
    at: new Date().toISOString(),
  });
  revalidatePath("/admin");
  revalidatePath("/admin/licenses");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/licenses");

  const messages = {
    revoke: "เพิกถอนไลเซนส์แล้ว",
    reset: "รีเซ็ตการเปิดใช้งานแล้ว",
    extend: "ขยายอายุไลเซนส์แล้ว",
  };
  return { ok: true, message: messages[input.action] };
}
