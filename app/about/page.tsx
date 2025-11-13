import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Image } from "@imagekit/next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

const baseUrl = "https://vairanya.in";

export const metadata: Metadata = {
  title: "About Us - Our Story | Vairanya Handcrafted Jewellery",
  description: "Discover Vairanya's journey in creating handcrafted, anti-tarnish jewellery. Learn how we combine traditional craftsmanship with modern design to create timeless pieces. Where elegance meets soul.",
  keywords: [
    "about vairanya",
    "jewellery brand story",
    "handcrafted jewellery",
    "anti-tarnish jewellery",
    "jewellery craftsmanship",
    "Vairanya story",
    "jewellery brand India",
  ],
  openGraph: {
    title: "About Us - Our Story | Vairanya",
    description: "Discover Vairanya's journey in creating handcrafted, anti-tarnish jewellery. Learn how we combine traditional craftsmanship with modern design.",
    type: "website",
    url: `${baseUrl}/about`,
    siteName: "Vairanya",
    images: [
      {
        url: `${baseUrl}/images/hero-jewelry.jpg`,
        width: 1200,
        height: 630,
        alt: "Vairanya Handcrafted Jewellery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us - Our Story | Vairanya",
    description: "Discover Vairanya's journey in creating handcrafted, anti-tarnish jewellery.",
    images: [`${baseUrl}/images/hero-jewelry.jpg`],
  },
  alternates: {
    canonical: `${baseUrl}/about`,
  },
};

export default function AboutPage() {
  // Organization schema for About page
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vairanya",
    url: baseUrl,
    logo: `${baseUrl}/images/logo-ivory.png`,
    description: "Handcrafted, anti-tarnish jewellery designed for everyday elegance. Where elegance meets soul.",
    foundingDate: "2024",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9691998370",
      contactType: "customer service",
      email: "hello@vairanya.in",
      areaServed: "IN",
      availableLanguage: "en",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Betul",
      addressRegion: "Madhya Pradesh",
      addressCountry: "IN",
    },
    sameAs: [
      // Add social media links when available
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-black">
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Header />
      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4 dark:text-white">Our Story</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Where Elegance Meets Soul
          </p>
        </div>

        <div className="space-y-6 sm:space-y-8 md:space-y-12">
          <section className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">The Beginning</h2>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                Vairanya was born from the union of tradition and minimal design. We believe that
                jewellery should be more than just adornment—it should be a reflection of your
                unique essence, a celebration of the glow within you.
              </p>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                Each piece in our collection is thoughtfully crafted to embody timeless elegance
                while embracing modern sensibilities. We combine traditional craftsmanship with
                contemporary design to create jewellery that speaks to your soul.
              </p>
            </div>
            <div className="relative h-64 sm:h-72 md:h-80 w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-[#1a1a1a]">
              <Image
                src="/images/ring-1.jpg"
                alt="Handcrafted jewellery craftsmanship at Vairanya - skilled artisans creating anti-tarnish jewellery"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                priority
              />
            </div>
          </section>

          <section className="bg-white dark:bg-[#0a0a0a] rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 shadow-sm dark:shadow-none border border-gray-200/50 dark:border-white/10">
            <h2 className="font-serif text-xl sm:text-2xl mb-4 sm:mb-6 dark:text-white">Our Promise</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base text-[#D4AF37]">Anti-Tarnish</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Our jewellery is crafted with anti-tarnish plating, ensuring your pieces
                  maintain their luster for years to come.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base text-[#D4AF37]">Hypoallergenic</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Safe for sensitive skin. All our pieces are designed to be comfortable and
                  gentle, perfect for everyday wear.
                </p>
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <h3 className="font-semibold mb-2 text-sm sm:text-base text-[#D4AF37]">Handcrafted</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Each piece is carefully handcrafted with attention to detail, ensuring quality
                  and uniqueness in every design.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 dark:text-white">Our Mission</h2>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
              At Vairanya, we're committed to creating jewellery that transcends trends. Our
              mission is to offer pieces that become cherished parts of your story—timeless,
              elegant, and built to last.
            </p>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              We believe in sustainable practices, ethical sourcing, and creating pieces that you
              can wear with confidence, knowing they're made with care and integrity.
            </p>
          </section>

          <div className="text-center pt-4 sm:pt-6 md:pt-8">
            <Button asChild className="bg-[#D4AF37] hover:bg-[#C19B2E] text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3">
              <Link href="/products">Explore Our Products</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
