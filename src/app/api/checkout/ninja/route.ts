import Stripe from "stripe";
import { NextResponse } from "next/server";

/**
 * Stripe checkout for Intuitive Ninja Training.
 *
 *   - Full package: $120 for all 5 sessions
 *   - Drop-in:      $30 per selected class date
 *   - Reg fee:      $30 one-time (mask & materials)
 *
 * Uses Stripe `price_data` so no Stripe-side product/price IDs are needed —
 * line items are built dynamically on each request.
 */

const PACKAGE_PRICE_CENTS = 12000; // $120.00
const DROP_IN_PRICE_CENTS = 3000; // $30.00
const REG_FEE_CENTS = 3000; // $30.00

type Plan = "package" | "drop_in" | "registration_fee_only";

interface NinjaCheckoutBody {
  plan: Plan;
  dropInDates?: string[]; // ["2026-06-16", ...]
  registrationFee: boolean;
  childName?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("Missing STRIPE_SECRET_KEY");
    return NextResponse.json(
      { error: "Payment service unavailable" },
      { status: 503 }
    );
  }

  const origin =
    request.headers.get("origin") ||
    `https://${request.headers.get("host")}`;

  let body: NinjaCheckoutBody;
  try {
    body = (await request.json()) as NinjaCheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  if (body.plan === "package") {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Intuitive Ninja Training — 5-session package",
          description: "June 16 – July 14, Tuesdays 4:30–5:30pm",
        },
        unit_amount: PACKAGE_PRICE_CENTS,
      },
      quantity: 1,
    });
  } else if (body.plan === "drop_in") {
    const dates = (body.dropInDates ?? []).filter(Boolean);
    if (dates.length === 0) {
      return NextResponse.json(
        { error: "Select at least one class date for drop-in" },
        { status: 400 }
      );
    }
    for (const iso of dates) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Drop-in class — ${formatDate(iso)}`,
            description: "Intuitive Ninja Training",
          },
          unit_amount: DROP_IN_PRICE_CENTS,
        },
        quantity: 1,
      });
    }
  } else if (body.plan === "registration_fee_only") {
    // Reg-fee-only checkout for already-registered families who haven't
    // paid the $30 mask & materials fee yet. The reg fee line item is
    // added below in the shared block.
  } else {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (body.registrationFee || body.plan === "registration_fee_only") {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Registration fee",
          description: "Mask & materials (one-time)",
        },
        unit_amount: REG_FEE_CENTS,
      },
      quantity: 1,
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json(
      { error: "Nothing to charge — pick a plan or registration fee" },
      { status: 400 }
    );
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/camps/registration-success`,
      cancel_url: `${origin}/camps/ninja-training/register`,
      customer_email: body.parentEmail || undefined,
      metadata: {
        camp: "Intuitive Ninja Training",
        plan: body.plan,
        drop_in_dates: (body.dropInDates ?? []).join(","),
        registration_fee: body.registrationFee ? "yes" : "no",
        child_name: body.childName || "",
        parent_name: body.parentName || "",
        parent_email: body.parentEmail || "",
        parent_phone: body.parentPhone || "",
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Ninja Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
