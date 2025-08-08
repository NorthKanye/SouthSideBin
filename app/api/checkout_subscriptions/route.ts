import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

type SubscriptionPlan = "fortnightly" | "weekly";

const getSubscriptionPriceId = (plan: SubscriptionPlan) => {
  switch (plan) {
    case "fortnightly":
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SUB_2_BINS_FORTNIGHTLY;
    case "weekly":
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SUB_2_BINS_WEEKLY;
    default:
      return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, address, notes, date, plan, discountCode } = body as {
      name: string;
      email: string;
      phone: string;
      address: string;
      notes?: string;
      date?: string;
      plan: SubscriptionPlan;
      discountCode?: string;
    };

    const priceId = getSubscriptionPriceId(plan);

    if (!priceId) {
      return NextResponse.json(
        { error: "Subscription price ID is not configured." },
        { status: 500 }
      );
    }

    // Save intent to Firestore
    const docRef = await addDoc(collection(db, "subscriptions"), {
      name,
      email,
      phone,
      address,
      notes: notes || "",
      plan,
      bins: 2,
      cadence: plan === "weekly" ? "weekly" : "fortnightly",
      startDateISO: date ? new Date(date).toISOString() : null,
      paymentStatus: "pending",
      subscriptionStatus: "awaiting_checkout",
      createdAt: new Date(),
    });

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}&subscriptionId=${docRef.id}`,
      cancel_url: `${req.headers.get("origin")}/cancel`,
      customer_email: email,
      metadata: {
        subscriptionId: docRef.id,
        customerName: name,
        customerPhone: phone,
        plan,
        bins: "2",
      },
      subscription_data: {
        metadata: {
          subscriptionId: docRef.id,
          customerName: name,
          customerPhone: phone,
          plan,
          bins: "2",
        },
      },
    };

    // Optional: apply promotion code
    if (discountCode) {
      try {
        const promotionCodes = await stripe.promotionCodes.list({ code: discountCode, active: true, limit: 1 });
        if (promotionCodes.data.length > 0) {
          (sessionConfig as any).discounts = [{ promotion_code: promotionCodes.data[0].id }];
        }
      } catch (e) {
        // continue without discount
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating subscription checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create subscription checkout session." },
      { status: 500 }
    );
  }
}


