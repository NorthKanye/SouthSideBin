"use client";

import { XCircle } from "lucide-react";

export default function CancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <XCircle className="w-16 h-16 text-red-500" />
      <h1 className="mt-4 text-4xl font-bold">Payment Cancelled</h1>
      <p className="mt-2 text-lg">
        Your payment was not processed. You can go back and try again.
      </p>
    </div>
  );
}
