import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to update booking status with error handling and logging
async function updateBookingStatus(bookingId: string, updateData: any, eventType: string) {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, updateData);
    console.log(`✅ Booking ${bookingId} updated via ${eventType}:`, updateData);
  } catch (error) {
    console.error(`❌ Error updating booking ${bookingId} via ${eventType}:`, error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("Missing stripe-signature header");
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  if (!endpointSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    console.log(`✅ Webhook received: ${event.type}`);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Update the booking status in Firebase
      if (session.metadata?.bookingId) {
        await updateBookingStatus(session.metadata.bookingId, {
          paymentStatus: "paid",
          serviceStatus: "scheduled",
          paymentIntentId: session.payment_intent,
          stripeSessionId: session.id,
          paidAt: new Date(),
        }, "checkout.session.completed");
      }
      break;

    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Find booking by payment intent metadata
      if (paymentIntent.metadata?.bookingId) {
        await updateBookingStatus(paymentIntent.metadata.bookingId, {
          paymentStatus: "paid",
          serviceStatus: "scheduled",
          paymentIntentId: paymentIntent.id,
          paidAt: new Date(),
        }, "payment_intent.succeeded");
      }
      break;

    case "charge.succeeded":
      const charge = event.data.object as Stripe.Charge;
      
      // Find booking by charge metadata
      if (charge.metadata?.bookingId) {
        await updateBookingStatus(charge.metadata.bookingId, {
          paymentStatus: "paid",
          serviceStatus: "scheduled",
          chargeId: charge.id,
          paidAt: new Date(),
        }, "charge.succeeded");
      }
      break;

    case "checkout.session.expired":
      const expiredSession = event.data.object as Stripe.Checkout.Session;
      
      // Mark booking as expired/cancelled in Firebase
      if (expiredSession.metadata?.bookingId) {
        await updateBookingStatus(expiredSession.metadata.bookingId, {
          paymentStatus: "expired",
          serviceStatus: "cancelled",
          expiredAt: new Date(),
        }, "checkout.session.expired");
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}