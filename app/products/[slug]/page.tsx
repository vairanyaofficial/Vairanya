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

const baseUrl = "https://vairanya.in";

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

  // Truncate description for meta tags (keep under 160 characters)
  const metaDescription = product.description.length > 160
    ? product.description.substring(0, 157).trim() + "..."
    : product.description;

  // Filter valid images - product.images should already be filtered by docToProduct
  // but we'll filter again here to be safe
  const validImages = (product.images || []).filter((img: string) => 
    img && typeof img === 'string' && img.trim() !== '' && 
    img.trim() !== 'undefined' && img.trim() !== 'null'
  );

  // Get primary image URL
  const primaryImage = validImages.length > 0
    ? validImages[0].startsWith("http")
      ? validImages[0]
      : `${baseUrl}${validImages[0]}`
    : `${baseUrl}/images/hero-jewelry.jpg`;

  // Get all image URLs for OpenGraph (only valid images)
  const ogImages = validImages.length > 0
    ? validImages.map((img: string) =>
        img.startsWith("http") ? img : `${baseUrl}${img}`
      )
    : [`${baseUrl}/images/hero-jewelry.jpg`];

  const productUrl = `${baseUrl}/products/${product.slug}`;

  return {
    title: product.title,
    description: metaDescription,
    keywords: [
      product.title,
      product.category,
      ...(product.tags || []),
      "jewellery",
      "anti-tarnish",
      "handcrafted",
      "gold plated",
    ],
    openGraph: {
      title: product.title,
      description: metaDescription,
      url: productUrl,
      siteName: "Vairanya",
      images: ogImages.map((url) => ({
        url,
        width: 1200,
        height: 630,
        alt: product.title,
      })),
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: metaDescription,
      images: [primaryImage],
    },
    alternates: {
      canonical: productUrl,
    },
    other: {
      "product:price:amount": product.price.toString(),
      "product:price:currency": "INR",
      "product:availability": product.stock_qty > 0 ? "in stock" : "out of stock",
      "product:condition": "new",
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
  const baseUrl = "https://vairanya.in";
  const productUrl = `${baseUrl}/products/${product.slug}`;
  // Filter valid images for structured data
  const validImages = (product.images || []).filter((img: string) => 
    img && typeof img === 'string' && img.trim() !== '' && 
    img.trim() !== 'undefined' && img.trim() !== 'null'
  );
  const productImages = validImages.length > 0
    ? validImages.map((img: string) =>
        img.startsWith("http") ? img : `${baseUrl}${img}`
      )
    : [`${baseUrl}/images/hero-jewelry.jpg`];

  // Capitalize category for breadcrumb
  const categoryName = product.category.charAt(0).toUpperCase() + product.category.slice(1);

  // Product structured data
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: productImages,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      "@type": "Brand",
      name: "Vairanya",
    },
    category: categoryName,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: product.price.toString(),
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      availability: product.stock_qty > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Vairanya",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          businessDays: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          },
          cutoffTime: "14:00",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
      },
    },
  };

  // BreadcrumbList structured data
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${baseUrl}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `${baseUrl}/products?category=${product.category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.title,
        item: productUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-8 lg:py-12">
        {/* Mobile Optimized Product Layout - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 lg:gap-12 mb-8 md:mb-16">
          {/* Image Gallery */}
          <div className="order-1">
            <ImageGallery 
              images={product.images || []} 
              productTitle={product.title} 
            />
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

