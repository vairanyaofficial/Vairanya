import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-black">
      <Header />
      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4 dark:text-white">Terms & Conditions</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 shadow-sm dark:shadow-none border border-gray-200/50 dark:border-white/10 space-y-6 sm:space-y-8">
          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Agreement to Terms</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              By accessing and using the Vairanya website, you accept and agree to be bound by the
              terms and provision of this agreement. If you do not agree to these terms, please do
              not use our website.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Products and Pricing</h2>
            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              <p>
                We strive to provide accurate product descriptions and pricing. However, we
                reserve the right to correct any errors, inaccuracies, or omissions and to change
                or update information at any time without prior notice.
              </p>
              <p>
                All prices are in Indian Rupees (INR) and are subject to change without notice. We
                reserve the right to refuse any order placed with us.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Orders and Payment</h2>
            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              <p>
                When you place an order, you are making an offer to purchase products at the prices
                stated. We reserve the right to accept or decline your order for any reason.
              </p>
              <p>
                Payment must be received before we ship your order. We accept payment through
                Razorpay (credit/debit cards, UPI, net banking) and Cash on Delivery (COD) for
                eligible orders.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Shipping and Delivery</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              Estimated delivery times are provided for reference only. We are not responsible for
              delays caused by shipping carriers or customs. Risk of loss and title for products
              pass to you upon delivery to the carrier.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Returns and Refunds</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              Please refer to our{" "}
              <a href="/shipping-returns" className="text-[#D4AF37] hover:underline">
                Shipping & Returns
              </a>{" "}
              page for detailed information about our return and refund policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Intellectual Property</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              All content on this website, including text, graphics, logos, images, and software,
              is the property of Vairanya and is protected by Indian and international copyright
              laws.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Limitation of Liability</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              Vairanya shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages resulting from your use of or inability to use the website or
              products.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Governing Law</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              These terms and conditions are governed by and construed in accordance with the laws
              of India. Any disputes arising from these terms shall be subject to the exclusive
              jurisdiction of the courts in Betul, Madhya Pradesh.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Changes to Terms</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              We reserve the right to modify these terms at any time. Changes will be effective
              immediately upon posting on the website. Your continued use of the website after
              changes are posted constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Contact Information</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              If you have any questions about these Terms & Conditions, please contact us at{" "}
              <a href="mailto:hello@vairanya.in" className="text-[#D4AF37] hover:underline">
                hello@vairanya.in
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
