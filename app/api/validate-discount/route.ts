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

export async function POST(req: NextRequest) {
  try {
    const { discountCode, bins } = await req.json();

    if (!bins) {
      return NextResponse.json(
        { error: "Bins are required" },
        { status: 400 }
      );
    }

    const priceId = getPriceIdForBins(bins);
    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid number of bins or missing price ID" },
        { status: 400 }
      );
    }

    // Fetch live price from Stripe price
    const price = await stripe.prices.retrieve(priceId);
    if (typeof price.unit_amount !== "number") {
      return NextResponse.json(
        { error: "Price amount missing for selected bins" },
        { status: 400 }
      );
    }
    const basePrice = price.unit_amount / 100;

    try {
      // If no code typed yet, just return base price for live display
      if (!discountCode || discountCode.trim().length === 0) {
        return NextResponse.json({
          isValid: false,
          discountAmount: 0,
          discountPercent: 0,
          finalPrice: basePrice,
        });
      }

      // Search for promotion codes that match the provided code
      const promotionCodes = await stripe.promotionCodes.list({
        code: discountCode,
        active: true,
        limit: 1,
      });

      if (promotionCodes.data.length === 0) {
        return NextResponse.json({
          isValid: false,
          discountAmount: 0,
          discountPercent: 0,
          finalPrice: basePrice,
          error: "Invalid or expired discount code",
        });
      }

      const promotionCode = promotionCodes.data[0];
      const coupon = promotionCode.coupon;

      if (!coupon.valid) {
        return NextResponse.json({
          isValid: false,
          discountAmount: 0,
          discountPercent: 0,
          finalPrice: basePrice,
          error: "Discount code has expired",
        });
      }

      if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
        return NextResponse.json({
          isValid: false,
          discountAmount: 0,
          discountPercent: 0,
          finalPrice: basePrice,
          error: "Discount code has reached its usage limit",
        });
      }

      if (promotionCode.max_redemptions && promotionCode.times_redeemed >= promotionCode.max_redemptions) {
        return NextResponse.json({
          isValid: false,
          discountAmount: 0,
          discountPercent: 0,
          finalPrice: basePrice,
          error: "Discount code has reached its usage limit",
        });
      }

      let discountAmount = 0;
      let discountPercent = 0;
      let finalPrice = basePrice;

      if (coupon.percent_off) {
        discountPercent = coupon.percent_off;
        discountAmount = Math.round((basePrice * coupon.percent_off) / 100);
        finalPrice = basePrice - discountAmount;
      } else if (coupon.amount_off) {
        discountAmount = coupon.amount_off / 100; // Stripe amounts are in cents
        finalPrice = Math.max(0, basePrice - discountAmount);
      }

      return NextResponse.json({
        isValid: true,
        discountAmount,
        discountPercent,
        finalPrice,
        promotionCodeId: promotionCode.id,
        couponId: coupon.id,
      });

    } catch (stripeError: any) {
      console.error("Stripe error:", stripeError);
      return NextResponse.json({
        isValid: false,
        error: "Unable to validate discount code",
      });
    }

  } catch (error) {
    console.error("Error validating discount code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}