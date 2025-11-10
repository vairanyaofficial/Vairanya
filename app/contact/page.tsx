"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        alert(data.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-black">
      <Header />
      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4 dark:text-white">Get in Touch</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
          {/* Contact Information */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl mb-4 sm:mb-6 dark:text-white">Contact Information</h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base dark:text-white">Email</h3>
                    <a
                      href="mailto:hello@vairanya.in"
                      className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 hover:text-[#D4AF37] break-all"
                    >
                      hello@vairanya.in
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base dark:text-white">Phone</h3>
                    <a href="tel:+919691998370" className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 hover:text-[#D4AF37]">
                      +91 9691998370
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base dark:text-white">Address</h3>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                      Betul, Madhya Pradesh<br />
                      India
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0a] rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none border border-gray-200/50 dark:border-white/10">
              <h3 className="font-semibold mb-2 text-sm sm:text-base dark:text-white">Business Hours</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Monday - Friday: 10 AM - 6 PM<br />
                Saturday: 10 AM - 2 PM<br />
                Sunday: Closed
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 shadow-sm dark:shadow-none border border-gray-200/50 dark:border-white/10">
            <h2 className="font-serif text-xl sm:text-2xl mb-4 sm:mb-6 dark:text-white">Send us a Message</h2>
            {submitted ? (
              <div className="text-center py-6 sm:py-8">
                <div className="rounded-full bg-green-100 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Thank you!</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">We've received your message and will get back to you soon.</p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="w-full text-xs sm:text-sm"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 dark:text-white">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded border border-gray-300 dark:border-white/10 dark:bg-black dark:text-white px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 dark:text-white">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded border border-gray-300 dark:border-white/10 dark:bg-black dark:text-white px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 dark:text-white">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded border border-gray-300 dark:border-white/10 dark:bg-black dark:text-white px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 dark:text-white">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded border border-gray-300 dark:border-white/10 dark:bg-black dark:text-white px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-[#D4AF37] resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-xs sm:text-sm"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
