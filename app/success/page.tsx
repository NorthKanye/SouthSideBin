"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("bookingId");
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (sessionId && bookingId) {
      // The webhook should handle the database update
      // This is just for UI confirmation
      setIsConfirmed(true);
    }
  }, [sessionId, bookingId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <div className="max-w-md mx-auto">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="mt-4 text-4xl font-bold text-gray-900">Payment Successful!</h1>
        <p className="mt-4 text-lg text-gray-600">
          Thank you for your booking. We have received your payment and your bin cleaning service has been scheduled.
        </p>
        
        {bookingId && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Booking Reference:</p>
            <p className="font-mono text-sm font-semibold text-gray-900">{bookingId}</p>
          </div>
        )}
        
        <div className="mt-6 space-y-2">
          <p className="text-md text-gray-500">
            You will receive a confirmation email shortly with your service details.
          </p>
          <p className="text-sm text-gray-500">
            We'll contact you within 24 hours to confirm your appointment.
          </p>
        </div>

        <div className="mt-8">
          <Link href="/">
            <Button className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
