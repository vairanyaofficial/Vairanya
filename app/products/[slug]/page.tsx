import React from "react";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ImageGallery from "@/components/ImageGallery";
import ProductDetailClient from "@/components/ProductDetailClient";
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

  // Related products (same category, different product)
  const allProducts = await getAllProducts();
  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.product_id !== product.product_id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20">
          {/* Image Gallery */}
          <div>
            <ImageGallery images={product.images} productTitle={product.title} />
          </div>

          {/* Product Details */}
          <div>
            <ProductDetailClient product={product} />
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20">
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-8 tracking-tight">You may also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {relatedProducts.map((relatedProduct) => (
                <a
                  key={relatedProduct.product_id}
                  href={`/products/${relatedProduct.slug}`}
                  className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className="h-56 w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden group-hover:bg-gradient-to-br group-hover:from-gray-100 group-hover:to-gray-50 transition-all duration-300">
                    <img
                      src={relatedProduct.images[0] || "/images/ring-1.jpg"}
                      alt={relatedProduct.title}
                      className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <h4 className="font-medium text-sm font-serif mb-2 group-hover:text-[#D4AF37] transition-colors">{relatedProduct.title}</h4>
                    <p className="mt-2 font-semibold text-base text-gray-900">₹{relatedProduct.price}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

