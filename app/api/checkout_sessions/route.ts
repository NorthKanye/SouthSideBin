import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Rely on default pinned version; avoid TS literal mismatch from earlier scaffold
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
  const body = await req.json();
  const { name, email, phone, address, notes, bins, date, discountCode, addressDetails } = body as any;

  const priceId = getPriceIdForBins(bins);

  if (!priceId) {
    return NextResponse.json(
      { error: "Price ID is not configured for the selected number of bins." },
      { status: 500 }
    );
  }

  try {
    // Save booking to Firebase with all details
    const serviceDate = new Date(date);
    const docRef = await addDoc(collection(db, "bookings"), {
      name,
      email,
      phone,
      address,
      notes,
      addressDetails: addressDetails || null,
      bins: parseInt(bins, 10),
      serviceDate: serviceDate,
      serviceDateFormatted: serviceDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      serviceDateISO: serviceDate.toISOString(),
      discountCode: discountCode || null,
      paymentStatus: "pending",        // Payment status
      serviceStatus: "awaiting_payment", // Service status
      createdAt: new Date(),
    });

    // Prepare session configuration
    const sessionConfig: any = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}&bookingId=${docRef.id}`,
      cancel_url: `${req.headers.get("origin")}/cancel`,
      customer_email: email,
      metadata: {
        bookingId: docRef.id,
        customerName: name,
        customerPhone: phone,
        bins: bins,
        discountCode: discountCode || "",
        address: address || "",
        placeId: addressDetails?.placeId || "",
        postalCode: addressDetails?.addressComponents?.postalCode || "",
      },
      payment_intent_data: {
        metadata: {
          bookingId: docRef.id,
          customerName: name,
          customerPhone: phone,
          bins: bins,
          address: address || "",
          placeId: addressDetails?.placeId || "",
          postalCode: addressDetails?.addressComponents?.postalCode || "",
        },
      },
    };

    // Add discount code if provided
    if (discountCode) {
      try {
        // Find the promotion code
        const promotionCodes = await stripe.promotionCodes.list({
          code: discountCode,
          active: true,
          limit: 1,
        });

        if (promotionCodes.data.length > 0) {
          sessionConfig.discounts = [
            {
              promotion_code: promotionCodes.data[0].id,
            },
          ];
        }
      } catch (discountError) {
        console.error("Error applying discount code:", discountError);
        // Continue without discount if there's an error
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
