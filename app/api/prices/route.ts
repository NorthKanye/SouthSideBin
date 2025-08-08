import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const getPriceIdForBins = (bins: string) => {
  switch (bins) {
    case "1":
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_1_BIN;
    case "2":
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_2_BINS;
    case "3":
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_3_BINS;
    default:
      return null;
  }
};

export async function GET(_req: NextRequest) {
  try {
    const entries: Array<[string, string | null]> = [
      ["1", getPriceIdForBins("1")],
      ["2", getPriceIdForBins("2")],
      ["3", getPriceIdForBins("3")],
    ];

    const results = await Promise.all(
      entries.map(async ([bins, priceId]) => {
        if (!priceId) return [bins, null] as const;
        const price = await stripe.prices.retrieve(priceId);
        const amount = typeof price.unit_amount === "number" ? price.unit_amount / 100 : null;
        return [bins, amount] as const;
      })
    );

    const data: Record<string, number | null> = {};
    for (const [bins, amount] of results) {
      data[bins] = amount;
    }

    return NextResponse.json({ prices: data });
  } catch (error) {
    console.error("Error fetching Stripe prices:", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}


