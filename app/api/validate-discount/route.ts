import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Base prices for different bin counts
const getBasePrice = (bins: string) => {
  switch (bins) {
    case "1":
      return 20;
    case "2":
      return 40;
    case "3":
      return 50;
    default:
      return 0;
  }
};

export async function POST(req: NextRequest) {
  try {
    const { discountCode, bins } = await req.json();

    if (!discountCode || !bins) {
      return NextResponse.json(
        { error: "Discount code and bins are required" },
        { status: 400 }
      );
    }

    const basePrice = getBasePrice(bins);
    if (basePrice === 0) {
      return NextResponse.json(
        { error: "Invalid number of bins" },
        { status: 400 }
      );
    }

    try {
      // Search for promotion codes that match the provided code
      const promotionCodes = await stripe.promotionCodes.list({
        code: discountCode,
        active: true,
        limit: 1,
      });

      if (promotionCodes.data.length === 0) {
        return NextResponse.json({
          isValid: false,
          error: "Invalid or expired discount code",
        });
      }

      const promotionCode = promotionCodes.data[0];
      const coupon = promotionCode.coupon;

      // Check if the coupon is still valid
      if (!coupon.valid) {
        return NextResponse.json({
          isValid: false,
          error: "Discount code has expired",
        });
      }

      // Check usage limits
      if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
        return NextResponse.json({
          isValid: false,
          error: "Discount code has reached its usage limit",
        });
      }

      // Check if promotion code has usage restrictions
      if (promotionCode.max_redemptions && promotionCode.times_redeemed >= promotionCode.max_redemptions) {
        return NextResponse.json({
          isValid: false,
          error: "Discount code has reached its usage limit",
        });
      }

      // Calculate discount
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