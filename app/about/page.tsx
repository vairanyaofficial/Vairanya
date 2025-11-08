import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-black">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl md:text-5xl mb-4 dark:text-white">Our Story</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Where Elegance Meets Soul
          </p>
        </div>

        <div className="space-y-12">
          <section className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-serif text-2xl mb-4 dark:text-white">The Beginning</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Vairanya was born from the union of tradition and minimal design. We believe that
                jewellery should be more than just adornment—it should be a reflection of your
                unique essence, a celebration of the glow within you.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Each piece in our collection is thoughtfully crafted to embody timeless elegance
                while embracing modern sensibilities. We combine traditional craftsmanship with
                contemporary design to create jewellery that speaks to your soul.
              </p>
            </div>
            <div className="relative h-80 w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-[#1a1a1a]">
              <Image
                src="/images/ring-1.jpg"
                alt="Craftsmanship"
                fill
                className="object-cover"
              />
            </div>
          </section>

          <section className="bg-white dark:bg-[#0a0a0a] rounded-lg p-8 shadow-sm dark:shadow-none border border-gray-200/50 dark:border-white/10">
            <h2 className="font-serif text-2xl mb-4 dark:text-white">Our Promise</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-[#D4AF37]">Anti-Tarnish</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our jewellery is crafted with anti-tarnish plating, ensuring your pieces
                  maintain their luster for years to come.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-[#D4AF37]">Hypoallergenic</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Safe for sensitive skin. All our pieces are designed to be comfortable and
                  gentle, perfect for everyday wear.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-[#D4AF37]">Handcrafted</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Each piece is carefully handcrafted with attention to detail, ensuring quality
                  and uniqueness in every design.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-4 dark:text-white">Our Mission</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              At Vairanya, we're committed to creating jewellery that transcends trends. Our
              mission is to offer pieces that become cherished parts of your story—timeless,
              elegant, and built to last.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              We believe in sustainable practices, ethical sourcing, and creating pieces that you
              can wear with confidence, knowing they're made with care and integrity.
            </p>
          </section>

          <div className="text-center pt-8">
            <Button asChild className="bg-[#D4AF37] hover:bg-[#C19B2E]">
              <Link href="/products">Explore Our Products</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

