"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Carousel from "@/components/Carousel";
import HorizontalSlider from "@/components/HorizontalSlider";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, Leaf, Star, Truck, RotateCcw } from "lucide-react";
import type { Product } from "@/lib/products-types";
import type { Offer } from "@/lib/offers-types";
import type { CarouselSlide } from "@/lib/carousel-types";
import type { Review } from "@/lib/reviews-types";
import type { Collection } from "@/lib/collections-types";
import ReviewForm from "@/components/ReviewForm";

export default function Page() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Function to fetch featured reviews
  const fetchReviews = () => {
    fetch("/api/reviews/featured")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.reviews) {
          setReviews(data.reviews);
        }
      })
      .catch((err) => {
        console.error("Failed to load reviews:", err);
      });
  };

  useEffect(() => {
    // Fetch all products from public API endpoint
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAllProducts(data.products);
          const newProducts = data.products.filter((p: Product) => p.is_new);
          // If we have new products, use them; otherwise use first 4 products
          if (newProducts.length > 0) {
            setFeaturedProducts(newProducts.slice(0, 4));
          } else {
            // Fallback to first 4 products if no new products
            setFeaturedProducts(data.products.slice(0, 4));
          }
        }
      })
      .catch(() => {
        // Fallback to static import
        import("@/lib/products").then((mod) => {
          setAllProducts(mod.products);
          const staticNew = mod.products.filter((p: Product) => p.is_new);
          if (staticNew.length > 0) {
            setFeaturedProducts(staticNew.slice(0, 4));
          } else {
            setFeaturedProducts(mod.products.slice(0, 4));
          }
        });
      });

    // Fetch featured collections
    fetch("/api/collections?featured=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.collections) {
          setFeaturedCollections(data.collections);
        } else {
          console.log("No featured collections found:", data);
        }
      })
      .catch((err) => {
        console.error("Failed to load collections:", err);
      });

    // Fetch active offers
    fetch("/api/offers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.offers) {
          setOffers(data.offers.slice(0, 3)); // Show max 3 offers
        } else {
          console.log("No offers found or API error:", data);
        }
      })
      .catch((err) => {
        console.error("Failed to load offers:", err);
      });

    // Fetch carousel slides
    fetch("/api/carousel")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.slides) {
          setCarouselSlides(data.slides);
        } else {
          console.log("No carousel slides found:", data);
        }
      })
      .catch((err) => {
        console.error("Failed to load carousel:", err);
      });

    // Fetch featured reviews
    fetchReviews();
  }, []);


  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white text-gray-900">
      <Header />

      {/* Carousel */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 pt-2 pb-3 md:pt-3 md:pb-4">
        {carouselSlides.length > 0 ? (
          <Carousel slides={carouselSlides} autoPlay={true} interval={5000} />
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">
            {/* Carousel will appear here once slides are added via admin panel */}
          </div>
        )}
      </section>

      {/* Special Offers - Compact */}
      {offers.length > 0 && (
        <section className="bg-gradient-to-r from-[#D4AF37]/5 via-[#C19B2E]/5 to-[#D4AF37]/5 py-4 md:py-5 border-y border-[#D4AF37]/10">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
              <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">Special Offers:</span>
              {offers.slice(0, 3).map((offer, index) => (
                <Link
                  key={offer.id}
                  href="/products"
                  className="group inline-flex items-center gap-1.5 md:gap-2 bg-white/80 hover:bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-[#D4AF37]/30 hover:border-[#D4AF37]/50 shadow-sm hover:shadow transition-all duration-200"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm md:text-base font-bold text-[#D4AF37]">
                      {offer.discount_type === "percentage"
                        ? `${offer.discount_value}%`
                        : `₹${offer.discount_value}`}
                    </span>
                    <span className="text-xs text-gray-600 font-medium">OFF</span>
                  </div>
                  <span className="text-xs text-gray-700 hidden sm:inline truncate max-w-[120px]">
                    {offer.title}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-[#D4AF37]"></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Collections */}
      {featuredCollections.length > 0 && (
        <>
          {featuredCollections.map((collection) => {
            const collectionProducts = collection.product_ids
              .map((productId) => allProducts.find((p) => p.product_id === productId))
              .filter((p): p is Product => p !== undefined);

            if (collectionProducts.length === 0) return null;

            return (
              <section key={collection.id} className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 py-6 md:py-8">
                {collection.image ? (
                  <div className="mb-4 md:mb-5 relative">
                    <div className="relative w-full h-32 md:h-40 rounded-lg shadow-sm overflow-hidden">
                      <img
                        src={collection.image}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Collection Name Overlay - Centered */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                        <h2 className="font-serif text-xl md:text-2xl font-light text-white tracking-tight text-center px-4 drop-shadow-2xl">
                          {collection.name}
                        </h2>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center mb-4 md:mb-5">
                    <h2 className="font-serif text-2xl md:text-3xl font-light mb-1.5 tracking-tight">
                      {collection.name}
                    </h2>
                    {collection.short_description && (
                      <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
                        {collection.short_description}
                      </p>
                    )}
                  </div>
                )}
                {/* Description below banner (if banner exists) */}
                {collection.image && collection.short_description && (
                  <div className="text-center mb-4">
                    <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
                      {collection.short_description}
                    </p>
                  </div>
                )}
                {/* Products Slider */}
                <HorizontalSlider
                  items={collectionProducts}
                  renderItem={(product) => (
                    <div className="min-w-[260px] max-w-[260px]">
                      <ProductCard product={product} />
                    </div>
                  )}
                  cardWidth={276} // 260px card + 16px gap
                  gap={16}
                  infiniteScroll={false}
                  showNavigation={collectionProducts.length > 2}
                  emptyMessage="No products in this collection"
                />
                {collectionProducts.length > 2 && (
                  <div className="text-center mt-4">
                    <Button asChild variant="outline" className="border border-gray-300 hover:border-[#D4AF37] px-5 py-2 text-sm font-medium rounded-lg hover:bg-[#D4AF37]/5 transition-all duration-300">
                      <Link href={`/products?collection=${collection.slug}`}>
                        View All {collection.name}
                      </Link>
                    </Button>
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}

      {/* Featured Collection (Fallback - New Products) */}
      {featuredProducts.length > 0 && featuredCollections.length === 0 && (
        <section id="collection" className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 py-6 md:py-8">
          <div className="text-center mb-4 md:mb-5">
            <h2 className="font-serif text-2xl md:text-3xl font-light mb-1.5 tracking-tight">Featured Collection</h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">Discover our handpicked selection of timeless pieces</p>
          </div>
          <HorizontalSlider
            items={featuredProducts}
            renderItem={(product) => (
              <div className="min-w-[260px] max-w-[260px]">
                <ProductCard product={product} />
              </div>
            )}
            cardWidth={276} // 260px card + 16px gap
            gap={16}
            infiniteScroll={false}
            showNavigation={featuredProducts.length > 2}
            emptyMessage="No featured products available"
          />
          <div className="text-center mt-4">
            <Button asChild variant="outline" className="border border-gray-300 hover:border-[#D4AF37] px-5 py-2 text-sm font-medium rounded-lg hover:bg-[#D4AF37]/5 transition-all duration-300">
              <Link href="/products">View All Products</Link>
            </Button>
          </div>
        </section>
      )}

      {/* How It's Made */}
      <section className="bg-white py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-serif text-2xl md:text-3xl font-light text-center mb-6 md:mb-8 tracking-tight">How It's Made</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center group">
              <div className="rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 w-16 h-16 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-base md:text-lg font-medium mb-1.5">Crafted</h3>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                Each piece is carefully handcrafted by skilled artisans, ensuring quality and
                attention to detail.
              </p>
            </div>
            <div className="text-center group">
              <div className="rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 w-16 h-16 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-base md:text-lg font-medium mb-1.5">Anti-tarnish</h3>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                Advanced plating technology prevents tarnishing, keeping your jewellery looking
                new for years.
              </p>
            </div>
            <div className="text-center group">
              <div className="rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 w-16 h-16 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Leaf className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-base md:text-lg font-medium mb-1.5">Sustainable</h3>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                We're committed to ethical practices and sustainable materials, ensuring beauty
                that lasts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 py-5 md:py-6">
        <div className="text-center mb-5">
          <h2 className="font-serif text-2xl md:text-3xl font-light mb-1.5 tracking-tight">What Our Customers Say</h2>
          <p className="text-gray-600 text-xs md:text-sm mb-2">
            You can also be featured!{" "}
            <button
              onClick={() => setShowReviewForm(true)}
              className="text-[#D4AF37] hover:underline font-medium"
            >
              Write a review
            </button>
          </p>
        </div>

        <HorizontalSlider
          items={reviews}
          renderItem={(review) => (
            <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 min-w-[240px] max-w-[240px]">
              <div className="flex gap-0.5 mb-2.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < review.rating
                        ? "fill-[#D4AF37] text-[#D4AF37]"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-700 mb-2.5 text-xs md:text-sm leading-relaxed line-clamp-3">
                "{review.review_text}"
              </p>
              <p className="font-semibold text-xs md:text-sm text-gray-900">— {review.customer_name}</p>
            </div>
          )}
          cardWidth={256} // 240px card + 16px gap
          gap={16}
          infiniteScroll={true}
          showNavigation={reviews.length > 1}
          buttonSize="sm"
          emptyMessage="No reviews yet. Be the first to review!"
        />
      </section>

      <ReviewForm open={showReviewForm} onOpenChange={setShowReviewForm} onReviewSubmitted={fetchReviews} />

      {/* Why Choose Vairanya - Compact Horizontal */}
      <section className="bg-gradient-to-br from-gray-50/50 to-white py-6 md:py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-serif text-2xl md:text-3xl font-light text-center mb-5 md:mb-6 tracking-tight">Why Choose Vairanya</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 mb-2.5 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-base md:text-lg font-medium mb-1">Premium Quality</h3>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                Finest materials and craftsmanship
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 mb-2.5 group-hover:scale-110 transition-transform duration-300">
                <Truck className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-base md:text-lg font-medium mb-1">Free Shipping</h3>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                Over ₹999 with fast delivery
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 mb-2.5 group-hover:scale-110 transition-transform duration-300">
                <RotateCcw className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-base md:text-lg font-medium mb-1">Easy Returns</h3>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                30-day hassle-free policy
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 mb-2.5 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-base md:text-lg font-medium mb-1">Lifetime Care</h3>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                Expert guidance and support
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
