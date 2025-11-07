import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl md:text-5xl mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm space-y-8">
          <section>
            <h2 className="font-serif text-2xl mb-4">Introduction</h2>
            <p className="text-gray-700 mb-4">
              At Vairanya, we are committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you
              visit our website and make a purchase.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-4">Information We Collect</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">Personal Information</h3>
                <p>
                  When you make a purchase or attempt to make a purchase, we collect certain
                  information, including:
                </p>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Shipping address</li>
                  <li>Billing address</li>
                  <li>Payment information (processed securely through Razorpay)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Automatically Collected Information</h3>
                <p>
                  When you visit our website, we automatically collect certain information about
                  your device, including information about your web browser, IP address, time
                  zone, and some of the cookies that are installed on your device.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Process and fulfill your orders</li>
              <li>Send you order confirmations and shipping updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send you marketing communications (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Detect and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-4">Sharing Your Information</h2>
            <p className="text-gray-700 mb-4">
              We share your information with service providers who help us operate our business,
              including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Payment processors (Razorpay) for payment processing</li>
              <li>Shipping carriers for order delivery</li>
              <li>Email service providers for communication</li>
            </ul>
            <p className="text-gray-700 mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-4">Data Security</h2>
            <p className="text-gray-700">
              We implement appropriate security measures to protect your personal information.
              However, no method of transmission over the Internet or electronic storage is 100%
              secure. While we strive to use commercially acceptable means to protect your
              information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-4">Cookies</h2>
            <p className="text-gray-700">
              We use cookies to enhance your browsing experience, analyze site traffic, and
              personalize content. You can control cookie preferences through your browser
              settings.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-4">Contact Us</h2>
            <p className="text-gray-700">
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

