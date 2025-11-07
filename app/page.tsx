"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Carousel from "@/components/Carousel";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, Leaf, Star, Tag, Percent, Calendar, Truck, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/products-types";
import type { Offer } from "@/lib/offers-types";
import type { CarouselSlide } from "@/lib/carousel-types";
import type { Review } from "@/lib/reviews-types";
import ReviewForm from "@/components/ReviewForm";

export default function Page() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const reviewsScrollRef = React.useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

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
    // Fetch new products from public API endpoint
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
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
          const staticNew = mod.products.filter((p: Product) => p.is_new);
          if (staticNew.length > 0) {
            setFeaturedProducts(staticNew.slice(0, 4));
          } else {
            setFeaturedProducts(mod.products.slice(0, 4));
          }
        });
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

  // Initialize scroll position for infinite scroll
  useEffect(() => {
    if (reviewsScrollRef.current && reviews.length > 0) {
      // Start at the middle (original reviews) for infinite scroll
      const cardWidth = 336; // 320px + 16px gap
      const startPosition = reviews.length * cardWidth;
      reviewsScrollRef.current.scrollLeft = startPosition;
    }
  }, [reviews.length]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white text-gray-900">
      <Header />

      {/* Carousel */}
      <section className="max-w-7xl mx-auto px-6 pt-4 pb-8 md:pt-6 md:pb-12">
        {carouselSlides.length > 0 ? (
          <Carousel slides={carouselSlides} autoPlay={true} interval={5000} />
        ) : (
          <div className="text-center py-12 text-gray-400 text-sm">
            {/* Carousel will appear here once slides are added via admin panel */}
          </div>
        )}
      </section>

      {/* Featured Collection */}
      <section id="collection" className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-light mb-4 tracking-tight">Featured Collection</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Discover our handpicked selection of timeless pieces</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Button asChild variant="outline" className="border-2 border-gray-300 hover:border-[#D4AF37] px-8 py-6 text-base font-medium rounded-lg hover:bg-[#D4AF37]/5 transition-all duration-300">
            <Link href="/collection">View All Products</Link>
          </Button>
        </div>
      </section>

      {/* Special Offers */}
      {offers.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl md:text-4xl font-light mb-2 tracking-tight">Special Offers</h2>
              <p className="text-gray-500 text-sm">Limited time deals</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {offers.map((offer) => (
                <Link
                  key={offer.id}
                  href="/collection"
                  className="group relative bg-gradient-to-br from-[#D4AF37]/5 to-[#C19B2E]/5 rounded-xl p-6 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/10 rounded-bl-full"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-serif text-lg font-medium mb-1 group-hover:text-[#D4AF37] transition-colors">
                          {offer.title}
                        </h3>
                        {offer.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {offer.description}
                          </p>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-[#D4AF37] to-[#C19B2E] text-white rounded-lg p-2.5 flex items-center justify-center shadow-sm ml-2 flex-shrink-0">
                        {offer.discount_type === "percentage" ? (
                          <Percent className="h-4 w-4" />
                        ) : (
                          <Tag className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-[#D4AF37]">
                        {offer.discount_type === "percentage"
                          ? `${offer.discount_value}%`
                          : `₹${offer.discount_value}`}
                      </span>
                      <span className="text-sm text-gray-600 font-medium">OFF</span>
                    </div>
                    {offer.min_order_amount && (
                      <p className="text-xs text-gray-500 mb-3">
                        Min. order ₹{offer.min_order_amount}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Valid until {new Date(offer.valid_until).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It's Made */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-serif text-4xl md:text-5xl font-light text-center mb-16 tracking-tight">How It's Made</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            <div className="text-center group">
              <div className="rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 w-24 h-24 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-12 w-12 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-2xl font-medium mb-3">Crafted</h3>
              <p className="text-gray-600 leading-relaxed">
                Each piece is carefully handcrafted by skilled artisans, ensuring quality and
                attention to detail.
              </p>
            </div>
            <div className="text-center group">
              <div className="rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 w-24 h-24 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-12 w-12 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-2xl font-medium mb-3">Anti-tarnish</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced plating technology prevents tarnishing, keeping your jewellery looking
                new for years.
              </p>
            </div>
            <div className="text-center group">
              <div className="rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 w-24 h-24 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Leaf className="h-12 w-12 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-2xl font-medium mb-3">Sustainable</h3>
              <p className="text-gray-600 leading-relaxed">
                We're committed to ethical practices and sustainable materials, ensuring beauty
                that lasts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-light mb-4 tracking-tight">What Our Customers Say</h2>
          <p className="text-gray-600 mb-4">
            You can also be featured!{" "}
            <button
              onClick={() => setShowReviewForm(true)}
              className="text-[#D4AF37] hover:underline font-medium"
            >
              Please write a small review
            </button>
          </p>
        </div>

        {reviews.length > 0 ? (
          <div className="relative">
            <div 
              ref={reviewsScrollRef}
              className="overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide scroll-smooth" 
              style={{ WebkitOverflowScrolling: 'touch' }}
              onScroll={(e) => {
                if (isScrolling) return;
                const container = e.currentTarget;
                const scrollLeft = container.scrollLeft;
                const scrollWidth = container.scrollWidth;
                const clientWidth = container.clientWidth;
                const cardWidth = 336; // 320px + 16px gap
                const sectionWidth = reviews.length * cardWidth;
                
                // If scrolled to the end (third cloned section), jump to the middle (original)
                if (scrollLeft >= sectionWidth * 2 - 50) {
                  setIsScrolling(true);
                  container.scrollLeft = sectionWidth + (scrollLeft - sectionWidth * 2);
                  setTimeout(() => setIsScrolling(false), 50);
                }
                // If scrolled to the beginning (first cloned section), jump to the middle (original)
                else if (scrollLeft <= 50) {
                  setIsScrolling(true);
                  container.scrollLeft = sectionWidth + scrollLeft;
                  setTimeout(() => setIsScrolling(false), 50);
                }
              }}
            >
              <div className="flex gap-6 min-w-max">
                {/* Clone reviews for infinite scroll */}
                {reviews.map((review) => (
                  <div
                    key={`clone-${review.id}`}
                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 min-w-[320px] max-w-[320px] flex-shrink-0"
                  >
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < review.rating
                              ? "fill-[#D4AF37] text-[#D4AF37]"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      "{review.review_text}"
                    </p>
                    <p className="font-semibold">— {review.customer_name}</p>
                  </div>
                ))}
                {/* Original reviews */}
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 min-w-[320px] max-w-[320px] flex-shrink-0"
                  >
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < review.rating
                              ? "fill-[#D4AF37] text-[#D4AF37]"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      "{review.review_text}"
                    </p>
                    <p className="font-semibold">— {review.customer_name}</p>
                  </div>
                ))}
                {/* Clone reviews again for seamless loop */}
                {reviews.map((review) => (
                  <div
                    key={`clone-end-${review.id}`}
                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 min-w-[320px] max-w-[320px] flex-shrink-0"
                  >
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < review.rating
                              ? "fill-[#D4AF37] text-[#D4AF37]"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      "{review.review_text}"
                    </p>
                    <p className="font-semibold">— {review.customer_name}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Navigation Buttons */}
            {reviews.length > 1 && (
              <>
                <button
                  onClick={() => {
                    if (reviewsScrollRef.current && !isScrolling) {
                      const scrollAmount = 336; // 320px card + 16px gap
                      reviewsScrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                    }
                  }}
                  className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-3 text-gray-700 hover:text-[#D4AF37] transition-all duration-300 z-10 shadow-lg border border-gray-200 hover:border-[#D4AF37]/30"
                  aria-label="Previous review"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => {
                    if (reviewsScrollRef.current && !isScrolling) {
                      const scrollAmount = 336; // 320px card + 16px gap
                      reviewsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                    }
                  }}
                  className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-3 text-gray-700 hover:text-[#D4AF37] transition-all duration-300 z-10 shadow-lg border border-gray-200 hover:border-[#D4AF37]/30"
                  aria-label="Next review"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No reviews yet. Be the first to review!</p>
          </div>
        )}
      </section>

      <ReviewForm open={showReviewForm} onOpenChange={setShowReviewForm} onReviewSubmitted={fetchReviews} />

      {/* Why Choose Vairanya */}
      <section className="bg-gradient-to-br from-gray-50 via-white to-gray-50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-light mb-4 tracking-tight">Why Choose Vairanya</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the perfect blend of elegance, quality, and craftsmanship
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-10 w-10 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-xl font-medium mb-3">Premium Quality</h3>
              <p className="text-gray-600 leading-relaxed">
                Every piece is crafted with meticulous attention to detail using the finest materials and techniques.
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Truck className="h-10 w-10 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-xl font-medium mb-3">Fast & Free Shipping</h3>
              <p className="text-gray-600 leading-relaxed">
                Free shipping on orders over ₹999. Fast and secure delivery across India with tracking.
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 mb-6 group-hover:scale-110 transition-transform duration-300">
                <RotateCcw className="h-10 w-10 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-xl font-medium mb-3">Easy Returns</h3>
              <p className="text-gray-600 leading-relaxed">
                30-day hassle-free return policy. If you're not satisfied, we'll make it right.
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-10 w-10 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-xl font-medium mb-3">Lifetime Care</h3>
              <p className="text-gray-600 leading-relaxed">
                Expert care guidance and support. Your jewellery is an investment we help you protect.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
