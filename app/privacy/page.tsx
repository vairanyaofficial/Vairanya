import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-black">
      <Header />
      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4 dark:text-white">Privacy Policy</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 shadow-sm dark:shadow-none border border-gray-200/50 dark:border-white/10 space-y-6 sm:space-y-8">
          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Introduction</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
              At Vairanya, we are committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you
              visit our website and make a purchase.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Information We Collect</h2>
            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base dark:text-white">Personal Information</h3>
                <p>
                  When you make a purchase or attempt to make a purchase, we collect certain
                  information, including:
                </p>
                <ul className="list-disc list-inside mt-2 ml-2 sm:ml-4 space-y-1">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Shipping address</li>
                  <li>Billing address</li>
                  <li>Payment information (processed securely through Razorpay)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base dark:text-white">Automatically Collected Information</h3>
                <p>
                  When you visit our website, we automatically collect certain information about
                  your device, including information about your web browser, IP address, time
                  zone, and some of the cookies that are installed on your device.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">How We Use Your Information</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 ml-2 sm:ml-4">
              <li>Process and fulfill your orders</li>
              <li>Send you order confirmations and shipping updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send you marketing communications (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Detect and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Sharing Your Information</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
              We share your information with service providers who help us operate our business,
              including:
            </p>
            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 ml-2 sm:ml-4">
              <li>Payment processors (Razorpay) for payment processing</li>
              <li>Shipping carriers for order delivery</li>
              <li>Email service providers for communication</li>
            </ul>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 mt-3 sm:mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Data Security</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              We implement appropriate security measures to protect your personal information.
              However, no method of transmission over the Internet or electronic storage is 100%
              secure. While we strive to use commercially acceptable means to protect your
              information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Your Rights</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 ml-2 sm:ml-4">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Cookies</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              We use cookies to enhance your browsing experience, analyze site traffic, and
              personalize content. You can control cookie preferences through your browser
              settings.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Contact Us</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
              If you have any questions about this Privacy Policy, please contact us at{" "}
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
