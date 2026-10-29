import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stripePaymentMethod(session: Stripe.Checkout.Session): "promptpay" | "card" | "other" | null {
  const types = session.payment_method_types ?? [];
  if (types.length !== 1) return null; // dynamic payment methods may list more than one eligible method
  if (types[0] === "promptpay") return "promptpay";
  if (types[0] === "card") return "card";
  return "other";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = getStripeServerClient().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.warn("Rejected Stripe webhook signature", error instanceof Error ? error.message : "invalid signature");
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const stripe = getStripeServerClient();

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntent = typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;
      // Keep the license active for partial refunds; revoke it only after a full refund.
      if (charge.amount_refunded >= charge.amount && paymentIntent) {
        const { error } = await admin.rpc("refund_web_order_by_payment_intent", {
          p_payment_intent: paymentIntent,
        });
        if (error) throw error;
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const eventSession = event.data.object as Stripe.Checkout.Session;
      const session = await stripe.checkout.sessions.retrieve(eventSession.id);
      if (session.mode !== "payment" || session.payment_status !== "paid") {
        // PromptPay can complete asynchronously; this event is not proof until Stripe says paid.
        return NextResponse.json({ received: true, pending: true });
      }
      const { data: order, error: orderError } = await admin.from("web_orders").select("id,user_id,order_number,plan_slug,duration_days,amount_satang,currency,payment_status,license_key_hash").eq("stripe_checkout_session_id", session.id).maybeSingle();
      if (orderError) throw orderError;
      if (!order) throw new Error("No local order for completed Checkout Session");
      if (
        session.client_reference_id !== order.user_id ||
        session.metadata?.user_id !== order.user_id ||
        session.metadata?.plan_slug !== order.plan_slug ||
        session.metadata?.order_number !== order.order_number ||
        Number(session.metadata?.duration_days) !== order.duration_days
      ) {
        throw new Error("Checkout metadata does not match stored order");
      }
      if (session.currency !== order.currency || session.amount_total !== order.amount_satang) {
        throw new Error("Checkout amount/currency does not match stored order");
      }
      if (order.payment_status === "paid" && order.license_key_hash) return NextResponse.json({ received: true, duplicate: true });

      const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null;
      const { error: issueError } = await admin.rpc("issue_web_order_license", {
        p_session_id: session.id,
        p_payment_intent: paymentIntent,
        p_payment_method: stripePaymentMethod(session),
      });
      if (issueError) throw issueError;
      return NextResponse.json({ received: true, issued: true });
    }

    if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { error } = await admin.rpc("update_web_order_status", {
        p_session_id: session.id,
        p_status: event.type === "checkout.session.expired" ? "canceled" : "failed",
        p_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : null,
        p_payment_method: stripePaymentMethod(session),
      });
      if (error) throw error;
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true, ignored: true });
  } catch (error) {
    // Return 500 so Stripe retries transient failures. Do not log sensitive payment payloads.
    console.error("Stripe webhook processing failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
