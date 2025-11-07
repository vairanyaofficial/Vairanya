import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Truck, RotateCcw, Package, Shield } from "lucide-react";

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl md:text-5xl mb-4">Shipping & Returns</h1>
          <p className="text-lg text-gray-600">
            Everything you need to know about shipping and returns
          </p>
        </div>

        <div className="space-y-12">
          {/* Shipping */}
          <section className="bg-white rounded-lg p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Truck className="h-6 w-6 text-[#D4AF37]" />
              <h2 className="font-serif text-2xl">Shipping Information</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Free Shipping</h3>
                <p className="text-gray-700 mb-4">
                  Free shipping on all orders over ₹999. No minimum order requirement for
                  standard shipping.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Shipping Options</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-[#D4AF37] pl-4">
                    <h4 className="font-medium">Standard Shipping</h4>
                    <p className="text-sm text-gray-600">₹50 | 3-5 business days</p>
                  </div>
                  <div className="border-l-4 border-[#D4AF37] pl-4">
                    <h4 className="font-medium">Express Shipping</h4>
                    <p className="text-sm text-gray-600">₹150 | 1-2 business days</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Shipping Locations</h3>
                <p className="text-gray-700">
                  We currently ship across India. International shipping is coming soon. For
                  delivery to remote areas, additional charges may apply.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Order Processing</h3>
                <p className="text-gray-700">
                  Orders are typically processed within 1-2 business days. You'll receive a
                  confirmation email with tracking information once your order ships.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Tracking Your Order</h3>
                <p className="text-gray-700">
                  Once your order ships, you'll receive a tracking number via email and SMS. You
                  can track your order status using the tracking link provided.
                </p>
              </div>
            </div>
          </section>

          {/* Returns */}
          <section className="bg-white rounded-lg p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <RotateCcw className="h-6 w-6 text-[#D4AF37]" />
              <h2 className="font-serif text-2xl">Returns & Exchanges</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">30-Day Return Policy</h3>
                <p className="text-gray-700 mb-4">
                  We offer a 30-day return policy from the date of delivery. If you're not
                  completely satisfied with your purchase, you can return it for a full refund.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Return Conditions</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Items must be unworn and in original condition</li>
                  <li>Items must be in original packaging with all tags attached</li>
                  <li>Proof of purchase (order number) is required</li>
                  <li>Customized or personalized items cannot be returned</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How to Return</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Contact us at hello@vairanya.in with your order number</li>
                  <li>We'll provide you with a return authorization and shipping instructions</li>
                  <li>Package the item securely in its original packaging</li>
                  <li>Ship the item back to us (return shipping costs are the customer's responsibility)</li>
                  <li>Once we receive and inspect the item, we'll process your refund</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Refunds</h3>
                <p className="text-gray-700 mb-2">
                  Refunds are processed within 5-7 business days after we receive the returned
                  item. The refund will be issued to the original payment method used for the
                  purchase.
                </p>
                <p className="text-gray-700">
                  Please note that return shipping costs are non-refundable.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Exchanges</h3>
                <p className="text-gray-700">
                  We offer size exchanges for rings within 30 days of purchase. Please contact us
                  at hello@vairanya.in with your order details to initiate an exchange. Exchanges
                  are subject to availability.
                </p>
              </div>
            </div>
          </section>

          {/* Warranty */}
          <section className="bg-white rounded-lg p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-6 w-6 text-[#D4AF37]" />
              <h2 className="font-serif text-2xl">Warranty</h2>
            </div>
            <p className="text-gray-700">
              All our jewellery comes with a 1-year warranty against manufacturing defects. If
              you experience any issues with your purchase due to manufacturing defects, please
              contact us at hello@vairanya.in with photos and details, and we'll be happy to
              assist you.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

