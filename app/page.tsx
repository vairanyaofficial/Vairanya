"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Carousel from "@/components/Carousel";
import HorizontalSlider from "@/components/HorizontalSlider";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, Leaf, Star, Truck, RotateCcw } from "lucide-react";
import type { Product } from "@/lib/products-types";
import type { Offer } from "@/lib/offers-types";
import type { CarouselSlide } from "@/lib/carousel-types";
import type { Review } from "@/lib/reviews-types";
import type { Collection } from "@/lib/collections-types";
import ReviewForm from "@/components/ReviewForm";
import {
  CarouselSkeleton,
  ProductSliderSkeleton,
  CollectionBannerSkeleton,
  OffersSkeleton,
  ReviewCardSkeleton,
} from "@/components/SkeletonLoader";

export default function Page() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Loading states
  const [isLoadingCarousel, setIsLoadingCarousel] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // Function to fetch featured reviews
  const fetchReviews = () => {
    setIsLoadingReviews(true);
    fetch("/api/reviews/featured")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.reviews) {
          setReviews(data.reviews);
        }
        setIsLoadingReviews(false);
      })
      .catch((err) => {
        console.error("Failed to load reviews:", err);
        setIsLoadingReviews(false);
      });
  };

  useEffect(() => {
    // Fetch all products from public API endpoint
    setIsLoadingProducts(true);
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          setAllProducts(data.products);
          // Products are already sorted by createdAt desc from API
          // Show the 4 most recent products (newest first)
          // This ensures newly added products appear on homepage
          setFeaturedProducts(data.products.slice(0, 4));
          setIsLoadingProducts(false);
        } else {
          // API returned success: false or invalid data, try fallback
          console.warn("API returned unsuccessful response, trying fallback:", data.error || "Unknown error");
          throw new Error(data.error || "API returned unsuccessful response");
        }
      })
      .catch((error) => {
        console.error("Failed to fetch products from API:", error);
        console.error("Error details:", {
          message: error?.message,
          stack: error?.stack,
        });
        
        // Log error for production debugging
        if (process.env.NODE_ENV === "production") {
          console.error("Production error - Products API failed. Check:");
          console.error("1. Firestore initialization in Vercel logs");
          console.error("2. FIREBASE_SERVICE_ACCOUNT_JSON environment variable");
          console.error("3. Visit /api/products/debug for diagnostics");
        }
        
        // Fallback to static import
        import("@/lib/products").then((mod) => {
          console.warn("Using fallback static products");
          setAllProducts(mod.products);
          const staticNew = mod.products.filter((p: Product) => p.is_new);
          if (staticNew.length > 0) {
            setFeaturedProducts(staticNew.slice(0, 4));
          } else {
            setFeaturedProducts(mod.products.slice(0, 4));
          }
          setIsLoadingProducts(false);
        }).catch((fallbackError) => {
          console.error("Fallback also failed:", fallbackError);
          setIsLoadingProducts(false);
        });
      });

    // Fetch featured collections
    setIsLoadingCollections(true);
    fetch("/api/collections?featured=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.collections) {
          setFeaturedCollections(data.collections);
        }
        setIsLoadingCollections(false);
      })
      .catch((err) => {
        console.error("Failed to load collections:", err);
        setIsLoadingCollections(false);
      });

    // Fetch active offers
    setIsLoadingOffers(true);
    fetch("/api/offers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.offers) {
          setOffers(data.offers.slice(0, 3)); // Show max 3 offers
        }
        setIsLoadingOffers(false);
      })
      .catch((err) => {
        console.error("Failed to load offers:", err);
        setIsLoadingOffers(false);
      });

    // Fetch carousel slides
    setIsLoadingCarousel(true);
    fetch("/api/carousel")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.slides) {
          setCarouselSlides(data.slides);
        }
        setIsLoadingCarousel(false);
      })
      .catch((err) => {
        console.error("Failed to load carousel:", err);
        setIsLoadingCarousel(false);
      });

    // Fetch featured reviews
    fetchReviews();
  }, []);

  // Create stable render functions using useCallback to avoid SSR serialization issues
  const renderProductItem = useCallback((product: Product) => (
    <div className="min-w-[260px] max-w-[260px]">
      <ProductCard product={product} />
    </div>
  ), []);

  const renderReviewItem = useCallback((review: Review) => (
    <div className="bg-black dark:bg-[#0a0a0a] rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-white/20 dark:border-white/20 min-w-[240px] max-w-[240px]">
      <div className="flex gap-0.5 mb-2.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < review.rating
                ? "fill-[#D4AF37] text-[#D4AF37]"
                : "text-gray-600 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
      <p className="text-white dark:text-white mb-2.5 text-xs md:text-sm leading-relaxed line-clamp-3">
        "{review.review_text}"
      </p>
      <p className="font-semibold text-xs md:text-sm text-white dark:text-white">— {review.customer_name}</p>
    </div>
  ), []);


  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-black dark:via-black dark:to-black text-gray-900 dark:text-white">
      <Header />

      {/* Carousel - Mobile Optimized */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12 pt-2 pb-3 md:pt-3 md:pb-4">
        {isLoadingCarousel ? (
          <CarouselSkeleton />
        ) : carouselSlides.length > 0 ? (
          <Carousel slides={carouselSlides} autoPlay={true} interval={5000} />
        ) : null}
      </section>

      {/* Special Offers - Mobile Optimized */}
      {isLoadingOffers ? (
        <OffersSkeleton />
      ) : offers.length > 0 ? (
        <section className="bg-gradient-to-r from-[#D4AF37]/5 via-[#C19B2E]/5 to-[#D4AF37]/5 dark:from-[#D4AF37]/10 dark:via-[#C19B2E]/10 dark:to-[#D4AF37]/10 py-4 md:py-5 border-y border-[#D4AF37]/10 dark:border-[#D4AF37]/20">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
            <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap px-2">
              <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-white whitespace-nowrap">Special Offers:</span>
              {offers.slice(0, 3).map((offer, index) => (
                <Link
                  key={offer.id}
                  href="/products"
                  className="group inline-flex items-center gap-1.5 md:gap-2 glass backdrop-blur-md active:glass-strong md:hover:glass-strong px-3 md:px-4 py-2 md:py-2 rounded-full border-2 md:border border-[#D4AF37]/30 active:border-[#D4AF37]/50 md:hover:border-[#D4AF37]/50 shadow-lg active:shadow-xl md:hover:shadow-xl transition-all duration-200 touch-manipulation"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm md:text-base font-bold text-[#D4AF37]">
                      {offer.discount_type === "percentage"
                        ? `${offer.discount_value}%`
                        : `₹${offer.discount_value}`}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-white font-semibold md:font-medium">OFF</span>
                  </div>
                  <span className="text-xs text-gray-700 dark:text-white hidden sm:inline truncate max-w-[120px]">
                    {offer.title}
                  </span>
                  <div className="w-1.5 h-1.5 md:w-1 md:h-1 rounded-full bg-[#D4AF37] hidden sm:block"></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Featured Collections */}
      {isLoadingCollections ? (
        <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12 py-4 md:py-6 lg:py-8">
          <CollectionBannerSkeleton />
          <ProductSliderSkeleton count={4} />
        </section>
      ) : featuredCollections.length > 0 ? (
        <>
          {featuredCollections.map((collection) => {
            const collectionProducts = collection.product_ids
              .map((productId) => allProducts.find((p) => p.product_id === productId))
              .filter((p): p is Product => p !== undefined);

            if (collectionProducts.length === 0) return null;

            return (
              <section key={collection.id} className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12 py-4 md:py-6 lg:py-8">
                <div className="text-left mb-4 md:mb-5">
                  <h2 className="font-serif text-2xl md:text-3xl font-light mb-1.5 tracking-tight px-4 text-gray-900 dark:text-white">
                    {collection.name}
                  </h2>
                  {collection.short_description && (
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl px-4">
                      {collection.short_description}
                    </p>
                  )}
                </div>
                {/* Products Slider */}
                <HorizontalSlider
                  items={collectionProducts}
                  renderItem={renderProductItem}
                  cardWidth={276} // 260px card + 16px gap
                  gap={16}
                  infiniteScroll={false}
                  showNavigation={collectionProducts.length > 2}
                  emptyMessage="No products in this collection"
                />
                {collectionProducts.length > 2 && (
                  <div className="text-center mt-4 md:mt-6">
                    <Button asChild variant="outline" className="border-2 md:border border-gray-300 dark:border-white active:border-[#D4AF37] dark:active:border-[#D4AF37] md:hover:border-[#D4AF37] dark:md:hover:border-[#D4AF37] px-6 md:px-5 py-3 md:py-2 text-sm font-semibold md:font-medium rounded-xl md:rounded-lg active:bg-[#D4AF37]/5 dark:active:bg-[#D4AF37]/5 md:hover:bg-[#D4AF37]/5 dark:md:hover:bg-[#D4AF37]/5 transition-all duration-300 touch-manipulation text-gray-900 dark:text-white active:text-[#D4AF37] dark:active:text-[#D4AF37] md:hover:text-[#D4AF37] dark:md:hover:text-[#D4AF37]">
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
      ) : null}

      {/* Featured Collection (Fallback - New Products) */}
      {isLoadingProducts ? (
        <section id="collection" className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 py-6 md:py-8">
          <div className="text-center mb-4 md:mb-5">
            <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </div>
          <ProductSliderSkeleton count={4} />
        </section>
      ) : featuredProducts.length > 0 && featuredCollections.length === 0 ? (
        <section id="collection" className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 py-6 md:py-8">
          <div className="text-center mb-4 md:mb-5">
            <h2 className="font-serif text-2xl md:text-3xl font-light mb-1.5 tracking-tight">Featured Collection</h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">Discover our handpicked selection of timeless pieces</p>
          </div>
          <HorizontalSlider
            items={featuredProducts}
            renderItem={renderProductItem}
            cardWidth={276} // 260px card + 16px gap
            gap={16}
            infiniteScroll={false}
            showNavigation={featuredProducts.length > 2}
            emptyMessage="No featured products available"
          />
          <div className="text-center mt-4">
            <Button asChild variant="outline" className="border border-gray-300 dark:border-white hover:border-[#D4AF37] dark:hover:border-[#D4AF37] px-5 py-2 text-sm font-medium rounded-lg hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/5 transition-all duration-300 text-gray-900 dark:text-white hover:text-[#D4AF37] dark:hover:text-[#D4AF37]">
              <Link href="/products">View All Products</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {/* How It's Made - Mobile Optimized */}
      <section className="bg-white dark:bg-black py-6 md:py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-12">
          <h2 className="font-serif text-2xl md:text-3xl font-light text-center mb-6 md:mb-8 tracking-tight px-4 text-gray-900 dark:text-white">How It's Made</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8">
            <div className="text-center group">
              <div className="rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 w-20 h-20 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-4 md:mb-3 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-10 w-10 md:h-8 md:w-8 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-lg md:text-lg font-medium mb-2 md:mb-1.5 text-gray-900 dark:text-white">Crafted</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-sm leading-relaxed max-w-sm mx-auto px-4 md:px-0">
                Each piece is carefully handcrafted by skilled artisans, ensuring quality and
                attention to detail.
              </p>
            </div>
            <div className="text-center group">
              <div className="rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 w-20 h-20 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-4 md:mb-3 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-10 w-10 md:h-8 md:w-8 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-lg md:text-lg font-medium mb-2 md:mb-1.5 text-gray-900 dark:text-white">Anti-tarnish</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-sm leading-relaxed max-w-sm mx-auto px-4 md:px-0">
                Advanced plating technology prevents tarnishing, keeping your jewellery looking
                new for years.
              </p>
            </div>
            <div className="text-center group">
              <div className="rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 w-20 h-20 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-4 md:mb-3 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <Leaf className="h-10 w-10 md:h-8 md:w-8 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-lg md:text-lg font-medium mb-2 md:mb-1.5 text-gray-900 dark:text-white">Sustainable</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-sm leading-relaxed max-w-sm mx-auto px-4 md:px-0">
                We're committed to ethical practices and sustainable materials, ensuring beauty
                that lasts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Mobile Optimized */}
      <section className="bg-black dark:bg-black py-5 md:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12">
          <div className="text-center mb-5 md:mb-6 px-4">
            <h2 className="font-serif text-2xl md:text-3xl font-light mb-2 md:mb-1.5 tracking-tight text-white dark:text-white">What Our Customers Say</h2>
            <p className="text-white/80 dark:text-white/80 text-sm md:text-sm mb-2">
              You can also be featured!{" "}
              <button
                onClick={() => setShowReviewForm(true)}
                className="text-[#D4AF37] active:underline md:hover:underline font-semibold md:font-medium touch-manipulation"
              >
                Write a review
              </button>
            </p>
          </div>

        {isLoadingReviews ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-[240px] max-w-[240px] shrink-0">
                <ReviewCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <HorizontalSlider
            items={reviews}
            renderItem={renderReviewItem}
            cardWidth={256} // 240px card + 16px gap
            gap={16}
            infiniteScroll={reviews.length > 2}
            showNavigation={reviews.length > 1}
            buttonSize="sm"
            emptyMessage="No reviews yet. Be the first to review!"
          />
        )}
        </div>
      </section>

      <ReviewForm open={showReviewForm} onOpenChange={setShowReviewForm} onReviewSubmitted={fetchReviews} />

      {/* Why Choose Vairanya - Mobile Optimized */}
      <section className="bg-gradient-to-br from-gray-50/50 to-white dark:from-black dark:to-black py-6 md:py-8 lg:py-10 border-t border-gray-100 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-12">
          <h2 className="font-serif text-2xl md:text-3xl font-light text-center mb-6 md:mb-8 tracking-tight px-4 text-gray-900 dark:text-white">Why Choose Vairanya</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 lg:gap-6">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-12 md:h-12 rounded-xl md:rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 mb-3 md:mb-2.5 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-7 w-7 md:h-6 md:w-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-base md:text-lg font-medium mb-1.5 md:mb-1 text-gray-900 dark:text-white">Premium Quality</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm leading-relaxed px-2 md:px-0">
                Finest materials and craftsmanship
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-12 md:h-12 rounded-xl md:rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 mb-3 md:mb-2.5 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <Truck className="h-7 w-7 md:h-6 md:w-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-base md:text-lg font-medium mb-1.5 md:mb-1 text-gray-900 dark:text-white">Free Shipping</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm leading-relaxed px-2 md:px-0">
                Over ₹999 with fast delivery
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-12 md:h-12 rounded-xl md:rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 mb-3 md:mb-2.5 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <RotateCcw className="h-7 w-7 md:h-6 md:w-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-base md:text-lg font-medium mb-1.5 md:mb-1 text-gray-900 dark:text-white">Easy Returns</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm leading-relaxed px-2 md:px-0">
                30-day hassle-free policy
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-12 md:h-12 rounded-xl md:rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 mb-3 md:mb-2.5 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <Star className="h-7 w-7 md:h-6 md:w-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-base md:text-lg font-medium mb-1.5 md:mb-1 text-gray-900 dark:text-white">Lifetime Care</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm leading-relaxed px-2 md:px-0">
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
