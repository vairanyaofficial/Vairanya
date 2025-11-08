// app/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw, AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service in production
    if (process.env.NODE_ENV === "production") {
      // TODO: Integrate with error reporting service (e.g., Sentry, LogRocket)
      console.error("Application error:", error);
    } else {
      console.error("Application error:", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-6 py-16">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-light text-gray-800 mb-4">
          Something Went Wrong
        </h1>
        <p className="text-gray-600 mb-8">
          We encountered an unexpected error. Please try refreshing the page or return to the homepage.
        </p>
        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm font-mono text-red-800 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>
            )}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="border border-gray-300 hover:border-[#D4AF37] px-6 py-3 rounded-xl font-medium"
          >
            <Link href="/" className="flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Go to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
