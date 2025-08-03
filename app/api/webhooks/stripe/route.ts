import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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
        try {
          const bookingRef = doc(db, "bookings", session.metadata.bookingId);
          await updateDoc(bookingRef, {
            paymentStatus: "paid",
            serviceStatus: "scheduled",
            paymentIntentId: session.payment_intent,
            stripeSessionId: session.id,
            paidAt: new Date(),
          });
          
          console.log(`Booking ${session.metadata.bookingId} marked as paid`);
        } catch (error) {
          console.error("Error updating booking status:", error);
        }
      }
      break;

    case "checkout.session.expired":
      const expiredSession = event.data.object as Stripe.Checkout.Session;
      
      // Mark booking as expired/cancelled in Firebase
      if (expiredSession.metadata?.bookingId) {
        try {
          const bookingRef = doc(db, "bookings", expiredSession.metadata.bookingId);
          await updateDoc(bookingRef, {
            paymentStatus: "expired",
            serviceStatus: "cancelled",
            expiredAt: new Date(),
          });
          
          console.log(`Booking ${expiredSession.metadata.bookingId} marked as expired`);
        } catch (error) {
          console.error("Error updating booking status:", error);
        }
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}