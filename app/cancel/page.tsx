"use client";

import { XCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CancelPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleReturnHome = () => {
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <div className="max-w-md w-full space-y-6">
        <XCircle className="w-20 h-20 text-red-500 mx-auto" />
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Payment Cancelled</h1>
          <p className="text-lg text-gray-600">
            Your payment was not processed. No charges were made to your account.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleReturnHome}
            size="lg"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.back()}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back to Booking
          </Button>
        </div>

        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p>Automatically redirecting to home in <span className="font-semibold text-gray-700">{countdown}</span> seconds...</p>
        </div>
      </div>
    </div>
  );
}
