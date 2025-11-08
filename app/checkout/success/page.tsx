"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-black">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
        </main>
        <Footer />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // safe read of searchParams (it can be nullish in some edge cases)
  const orderId = (searchParams?.get("order_id") as string) || "N/A";
  const paymentMethod = (searchParams?.get("method") as string) || "razorpay";
  const [orderNumber, setOrderNumber] = useState<string>("");

  // Fetch order details if orderId is available
  useEffect(() => {
    if (orderId && orderId !== "N/A" && user) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.order) {
            setOrderNumber(data.order.order_number || orderId);
          }
        })
        .catch(() => {
          setOrderNumber(orderId);
        });
    }
  }, [orderId, user]);

  const [seconds, setSeconds] = useState<number>(4);

  // useRef typed to the browser timer handle
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // start countdown once on mount
  useEffect(() => {
    // defensive cleanup if something left behind
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // perform navigation as a side-effect when seconds reaches 0
  useEffect(() => {
    if (seconds !== 0) return;

    // clear interval defensively
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // push inside a microtask to absolutely avoid any "update while rendering" timing edge-cases
    // router.push is async but wrapping in setTimeout(..., 0) defers it after rendering
    const t = setTimeout(() => {
      // optional: you can use router.replace if you don't want history entry
      router.push("/products");
    }, 0);

    return () => clearTimeout(t);
  }, [seconds, router]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-black">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
            <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <h1 className="font-serif text-4xl mb-4 text-gray-900 dark:text-white">Order Confirmed!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Thank you for your order. We've received your order and will begin processing it right
          away.
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Redirecting to collection in {seconds}s…</p>

        <div className="glass-card rounded-lg border border-gray-200/50 dark:border-white/10 p-8 mb-8 max-w-md mx-auto backdrop-blur-md bg-white/60 dark:bg-black/90">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="h-6 w-6 text-[#D4AF37]" />
            <h2 className="font-serif text-xl text-gray-900 dark:text-white">Order Details</h2>
          </div>

          <div className="space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Order Number:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{orderNumber || orderId}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
              <span className="font-semibold capitalize text-gray-900 dark:text-white">
                {paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Expected Delivery:</span>
              <span className="font-semibold text-gray-900 dark:text-white">3-5 business days</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A confirmation email has been sent to your email address with order details.
          </p>

          <div className="flex gap-4 justify-center">
            <Button asChild className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white">
              <Link href="/account">View My Orders</Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-black/60">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
