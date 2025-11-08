import React from "react";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ImageGallery from "@/components/ImageGallery";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductSuggestions from "@/components/ProductSuggestions";
import { getProductBySlug, getAllProducts } from "@/lib/products-server";
import type { Metadata } from "next";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: `${product.title} | Vairanya`,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.images,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((img) => `https://vairanya.in${img}`),
    brand: {
      "@type": "Brand",
      name: "Vairanya",
    },
    offers: {
      "@type": "Offer",
      url: `https://vairanya.in/products/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      availability: product.stock_qty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
    sku: product.sku,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-8 lg:py-12">
        {/* Mobile Optimized Product Layout - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 lg:gap-12 mb-8 md:mb-16">
          {/* Image Gallery */}
          <div className="order-1">
            <ImageGallery images={product.images} productTitle={product.title} />
          </div>

          {/* Product Details */}
          <div className="order-2">
            <ProductDetailClient product={product} />
          </div>
        </div>

        {/* Suggestions Sections - Load asynchronously */}
        <ProductSuggestions product={product} />
      </main>
      <Footer />
    </div>
  );
}

