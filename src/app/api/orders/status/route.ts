import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId || !sessionId.startsWith("cs_")) return NextResponse.json({ error: "bad_request" }, { status: 400 });
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("web_orders").select("order_number,payment_status,plan_name,amount_satang,created_at,paid_at,license_key_hash").eq("stripe_checkout_session_id", sessionId).eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ order: data });
  } catch (error) {
    console.error("Order status lookup failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
