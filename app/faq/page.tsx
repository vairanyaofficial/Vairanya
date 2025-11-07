"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is anti-tarnish jewellery?",
    answer:
      "Anti-tarnish jewellery is plated with a special coating that prevents oxidation and tarnishing, keeping your pieces looking new for longer. Our jewellery is designed to maintain its shine even with regular wear.",
  },
  {
    question: "Is your jewellery hypoallergenic?",
    answer:
      "Yes, all our jewellery is hypoallergenic and safe for sensitive skin. We use high-quality materials that are gentle and comfortable for everyday wear.",
  },
  {
    question: "How do I care for my jewellery?",
    answer:
      "To maintain the shine of your jewellery, avoid contact with perfumes, lotions, and water. Clean with a soft, dry cloth. Store in a dry place away from direct sunlight. For detailed care instructions, refer to the care card included with your order.",
  },
  {
    question: "What is your shipping policy?",
    answer:
      "We offer free shipping on orders over ₹999. Standard shipping (₹50) takes 3-5 business days, while express shipping (₹150) takes 1-2 business days. We ship across India.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We offer a 30-day return policy. Items must be unworn and in original packaging. Return shipping costs are the customer's responsibility. Refunds are processed within 5-7 business days after we receive the returned item.",
  },
  {
    question: "Do you offer size exchanges?",
    answer:
      "Yes, we offer size exchanges for rings within 30 days of purchase. Please contact us at hello@vairanya.in with your order details to initiate an exchange.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit/debit cards, UPI, net banking through Razorpay, and Cash on Delivery (COD) for orders above ₹500.",
  },
  {
    question: "How can I track my order?",
    answer:
      "Once your order is shipped, you'll receive a tracking number via email and SMS. You can track your order using the tracking link provided or by visiting our order tracking page.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Currently, we ship only within India. We're working on expanding our shipping to international destinations. Please check back soon or contact us for updates.",
  },
  {
    question: "Can I customize or personalize jewellery?",
    answer:
      "Yes, we offer customization services for select pieces. Please contact us at hello@vairanya.in with your requirements, and we'll work with you to create a unique piece.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl md:text-5xl mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions about our products, shipping, and policies.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-700">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg p-8 text-center shadow-sm">
          <h2 className="font-serif text-2xl mb-4">Still have questions?</h2>
          <p className="text-gray-600 mb-6">
            Can't find the answer you're looking for? Please contact our friendly team.
          </p>
          <a
            href="/contact"
            className="inline-block bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-6 py-3 rounded-md transition-colors"
          >
            Contact Us
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}

