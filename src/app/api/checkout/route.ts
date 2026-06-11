import Stripe from "stripe";
import { NextResponse } from "next/server";

// Mind Body Speech camp pricing
const EARLY_BIRD_PRICE_ID = "price_1TTpd0PhLMokpUfBoML067Y2"; // $275/week
const REGULAR_PRICE_ID = "price_1T6eSMPhLMokpUfBBOvtybJQ"; // $300/week
const BUNDLE_PRICE_ID = "price_1TTpd1PhLMokpUfBvWLi1YCS"; // $800 for all 3 weeks

// Early bird cutoff: May 10, 2026 at midnight ET
const EARLY_BIRD_CUTOFF = new Date("2026-05-10T04:00:00Z");

// Friends & Family coupon IDs (keyed by number of weeks)
const FAM_COUPONS: Record<number, string> = {
  1: "fam_1week",   // $30 off
  2: "fam_2weeks",  // $60 off
  3: "fam_3weeks",  // $90 off
};

const FAM_CODE = "CSSFAMILY";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.error("Missing STRIPE_SECRET_KEY environment variable");
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
  }

  const origin =
    request.headers.get("origin") ||
    `https://${request.headers.get("host")}`;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { quantity, selectedWeeks, childName, parentName, parentEmail, parentPhone, promoCode } = body;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 3) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }

  const isEarlyBird = new Date() < EARLY_BIRD_CUTOFF;
  const isBundle = quantity === 3;

  // Determine line items
  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  if (isBundle) {
    lineItems = [{ price: BUNDLE_PRICE_ID, quantity: 1 }];
  } else {
    const priceId = isEarlyBird ? EARLY_BIRD_PRICE_ID : REGULAR_PRICE_ID;
    lineItems = [{ price: priceId, quantity }];
  }

  // Apply F&F discount if valid promo code
  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  if (promoCode && promoCode.toUpperCase().trim() === FAM_CODE) {
    const couponId = FAM_COUPONS[quantity];
    if (couponId) {
      discounts.push({ coupon: couponId });
    }
  }

  try {
    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      ...(discounts.length > 0
        ? { discounts }
        : { allow_promotion_codes: true }),
      mode: "payment",
      success_url: `${origin}/camps/registration-success`,
      cancel_url: `${origin}/camps/mind-body-speech/register`,
      metadata: {
        child_name: childName || "",
        weeks_selected: selectedWeeks || "",
        parent_name: parentName || "",
        parent_email: parentEmail || "",
        parent_phone: parentPhone || "",
        pricing_tier: isEarlyBird ? "early_bird" : "regular",
        promo_code: promoCode || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
