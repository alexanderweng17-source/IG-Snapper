import { NextResponse } from "next/server";
import { data } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await data.listPlans();
    return NextResponse.json({
      plans: plans.map((plan) => ({
        slug: plan.slug,
        name: plan.name,
        durationDays: plan.durationDays,
        priceSatang: plan.priceSatang,
        isPlaceholderPrice: plan.isPlaceholderPrice,
        visible: plan.visible,
        highlight: Boolean(plan.highlight),
        tagline: plan.tagline,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to read storefront plans", error);
    return NextResponse.json({ error: "ไม่สามารถโหลดแพ็กเกจได้" }, { status: 500 });
  }
}
