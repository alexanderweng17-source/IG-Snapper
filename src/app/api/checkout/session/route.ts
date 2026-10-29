import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkoutIsEnabled, getStorePlan } from "@/lib/store/plans";
import { getStripeServerClient } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const url = new URL(request.url);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return url.origin;
  throw new Error("Missing NEXT_PUBLIC_SITE_URL; configure the canonical HTTPS site URL on Vercel.");
}

export async function POST(request: Request) {
  try {
    if (process.env.STORE_CHECKOUT_ENABLED !== "true") {
      return NextResponse.json({ error: "ร้านยังไม่เปิดรับชำระเงินจริง ขณะนี้กำลังตั้งค่าคีย์ Stripe/Supabase และทดสอบระบบ โปรดลองอีกครั้งภายหลัง" }, { status: 503 });
    }
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนสั่งซื้อ" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const slug = typeof body?.planSlug === "string" ? body.planSlug : "";
    const plan = getStorePlan(slug);
    if (!plan) return NextResponse.json({ error: "ไม่พบแพ็กเกจที่เลือก" }, { status: 400 });
    if (!checkoutIsEnabled(plan)) {
      return NextResponse.json({
        error: plan.isPlaceholderPrice
          ? "ยังไม่ได้กำหนดราคาขายจริงสำหรับแพ็กเกจนี้"
          : "ระบบรับชำระเงินยังตั้งค่าไม่ครบ กรุณาติดต่อผู้ดูแลระบบ",
      }, { status: 503 });
    }

    const admin = createSupabaseAdminClient();
    const origin = safeOrigin(request);
    const orderNumber = `IGS-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
    const stripe = getStripeServerClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      locale: "th",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "thb",
          unit_amount: plan.priceSatang,
          product_data: { name: `IG Snapper — ไลเซนส์ ${plan.name}`, description: `ใช้งาน ${plan.durationDays} วัน · คีย์จะออกเมื่อยืนยันชำระเงินสำเร็จ` },
        },
      }],
      metadata: { user_id: user.id, plan_slug: plan.slug, order_number: orderNumber, duration_days: String(plan.durationDays) },
      payment_intent_data: { metadata: { user_id: user.id, plan_slug: plan.slug, order_number: orderNumber } },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel?plan=${encodeURIComponent(plan.slug)}`,
    });

    const { error: insertError } = await admin.from("web_orders").insert({
      order_number: orderNumber,
      user_id: user.id,
      stripe_checkout_session_id: session.id,
      plan_slug: plan.slug,
      plan_name: plan.name,
      duration_days: plan.durationDays,
      amount_satang: plan.priceSatang,
      currency: "thb",
      payment_status: "pending",
    });
    if (insertError) {
      try { await stripe.checkout.sessions.expire(session.id); } catch { /* no user can access this orphan session */ }
      console.error("Unable to create pending order", insertError.message);
      return NextResponse.json({ error: "สร้างคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
    }
    if (!session.url) return NextResponse.json({ error: "Stripe ไม่ได้ส่งลิงก์ชำระเงินกลับมา" }, { status: 502 });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout session creation failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "ไม่สามารถเริ่มชำระเงินได้ในขณะนี้ โปรดลองใหม่ภายหลัง" }, { status: 500 });
  }
}
