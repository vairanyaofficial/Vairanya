"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
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
import { useAuth } from "@/components/AuthProvider";
import {
  CarouselSkeleton,
  ProductSliderSkeleton,
  CollectionBannerSkeleton,
  OffersSkeleton,
  ReviewCardSkeleton,
} from "@/components/SkeletonLoader";

const baseUrl = "https://vairanya.in";

// JSON-LD Structured Data for Organization and WebSite
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Vairanya",
  url: baseUrl,
  logo: `${baseUrl}/images/logo-ivory.png`,
  description: "Handcrafted, anti-tarnish jewellery designed for everyday elegance. Where elegance meets soul.",
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
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Vairanya",
  url: baseUrl,
  description: "Handcrafted, anti-tarnish jewellery designed for everyday elegance",
  publisher: {
    "@type": "Organization",
    name: "Vairanya",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${baseUrl}/products?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function Page() {
  const router = useRouter();
  const { user } = useAuth();
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

  // Function to fetch reviews (used as callback for ReviewForm)
  const fetchReviews = useCallback(async () => {
    setIsLoadingReviews(true);
    try {
      const res = await fetch("/api/reviews/featured");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reviews) {
          setReviews(data.reviews);
        }
      }
    } catch (err) {
      // Failed to load reviews
    } finally {
      setIsLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    // Set a timeout to ensure loading states are cleared even if APIs hang
    const timeoutId = setTimeout(() => {
      setIsLoadingProducts(false);
      setIsLoadingCollections(false);
      setIsLoadingOffers(false);
      setIsLoadingCarousel(false);
      setIsLoadingReviews(false);
    }, 10000); // 10 second timeout

    // Parallel fetch all APIs for better performance
    const fetchAllData = async () => {
      try {
        // Set all loading states to true
        setIsLoadingProducts(true);
        setIsLoadingCollections(true);
        setIsLoadingOffers(true);
        setIsLoadingCarousel(true);
        setIsLoadingReviews(true);

        // Fetch all APIs in parallel - limit products to 20 for faster initial load
        const [productsRes, collectionsRes, offersRes, carouselRes, reviewsRes] = await Promise.allSettled([
          fetch("/api/products?limit=20"),
          fetch("/api/collections?featured=true"),
          fetch("/api/offers"),
          fetch("/api/carousel"),
          fetch("/api/reviews/featured")
        ]);

        // Process products - always set state to trigger re-render
        if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
          try {
            const productsData = await productsRes.value.json();
            if (productsData.success && Array.isArray(productsData.products)) {
              // Always set products to trigger component re-render
              setAllProducts(productsData.products);
              if (productsData.products.length > 0) {
                setFeaturedProducts(productsData.products.slice(0, 4));
              } else {
                setFeaturedProducts([]);
              }
            } else {
              setAllProducts([]);
              setFeaturedProducts([]);
            }
          } catch (e) {
            setAllProducts([]);
            setFeaturedProducts([]);
          }
        } else {
          // Set empty arrays on error to trigger re-render
          setAllProducts([]);
          setFeaturedProducts([]);
        }
        setIsLoadingProducts(false);

        // Process collections - always try to parse response regardless of status
        if (collectionsRes.status === 'fulfilled') {
          try {
            const collectionsData = await collectionsRes.value.json();
            // Check for collections array regardless of success flag or status code
            if (collectionsData && Array.isArray(collectionsData.collections)) {
              setFeaturedCollections(collectionsData.collections);
            }
          } catch (e) {
            // Error parsing collections data
          }
        } else if (collectionsRes.status === 'rejected') {
          // Collections API rejected
        }
        setIsLoadingCollections(false);

        // Process offers
        if (offersRes.status === 'fulfilled' && offersRes.value.ok) {
          try {
            const offersData = await offersRes.value.json();
            if (offersData.success && offersData.offers) {
              setOffers(offersData.offers.slice(0, 3));
            }
          } catch (e) {
            // Error parsing offers data
          }
        }
        setIsLoadingOffers(false);

        // Process carousel
        if (carouselRes.status === 'fulfilled' && carouselRes.value.ok) {
          try {
            const carouselData = await carouselRes.value.json();
            if (carouselData.success && carouselData.slides) {
              setCarouselSlides(carouselData.slides);
            }
          } catch (e) {
            // Error parsing carousel data
          }
        }
        setIsLoadingCarousel(false);

        // Process reviews
        if (reviewsRes.status === 'fulfilled' && reviewsRes.value.ok) {
          try {
            const reviewsData = await reviewsRes.value.json();
            if (reviewsData.success && reviewsData.reviews) {
              setReviews(reviewsData.reviews);
            }
          } catch (e) {
            // Error parsing reviews data
          }
        }
        setIsLoadingReviews(false);

        // Clear timeout if everything loaded successfully
        clearTimeout(timeoutId);
      } catch (error) {
        // Handle any unexpected errors
        setIsLoadingProducts(false);
        setIsLoadingCollections(false);
        setIsLoadingOffers(false);
        setIsLoadingCarousel(false);
        setIsLoadingReviews(false);
        clearTimeout(timeoutId);
      }
    };

    fetchAllData();

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Create stable render functions using useCallback to avoid SSR serialization issues
  const renderProductItem = useCallback((product: Product, index?: number) => (
    <div className="min-w-[160px] max-w-[160px] sm:min-w-[200px] sm:max-w-[200px] md:min-w-[240px] md:max-w-[240px] lg:min-w-[260px] lg:max-w-[260px]">
      <ProductCard product={product} priority={index !== undefined && index < 4} />
    </div>
  ), []);

  const renderReviewItem = useCallback((review: Review) => (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-2.5 md:p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-white/20 min-w-[200px] max-w-[200px] md:min-w-[240px] md:max-w-[240px]">
      <div className="flex gap-0.5 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-2.5 w-2.5 md:h-3 md:w-3 ${
              i < review.rating
                ? "fill-[#D4AF37] text-[#D4AF37]"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
      <p className="text-gray-900 dark:text-white mb-2 text-[10px] md:text-sm leading-relaxed line-clamp-3">
        "{review.review_text}"
      </p>
      <p className="font-semibold text-[10px] md:text-sm text-gray-900 dark:text-white">— {review.customer_name}</p>
    </div>
  ), []);


  return (
    <>
      <Script
        id="organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Script
        id="website-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <main className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-black dark:via-black dark:to-black text-gray-900 dark:text-white">
        <Header />

      {/* Carousel - Mobile Optimized */}
      <section className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-12 pt-2 pb-2 md:pt-3 md:pb-4">
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
        <section className="bg-gradient-to-r from-[#D4AF37]/5 via-[#C19B2E]/5 to-[#D4AF37]/5 dark:from-[#D4AF37]/10 dark:via-[#C19B2E]/10 dark:to-[#D4AF37]/10 py-2.5 md:py-5 border-y border-[#D4AF37]/10 dark:border-[#D4AF37]/20">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
            <div className="flex items-center justify-center gap-1.5 md:gap-3 flex-wrap px-1">
              <span className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-white whitespace-nowrap">Special Offers:</span>
              {offers.slice(0, 3).map((offer, index) => (
                <Link
                  key={offer.id}
                  href="/products"
                  className="group inline-flex items-center gap-1 md:gap-2 glass backdrop-blur-md active:glass-strong md:hover:glass-strong px-2 md:px-4 py-1.5 md:py-2 rounded-full border md:border border-[#D4AF37]/30 active:border-[#D4AF37]/50 md:hover:border-[#D4AF37]/50 shadow-md active:shadow-lg md:hover:shadow-xl transition-all duration-200 touch-manipulation"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs md:text-base font-bold text-[#D4AF37]">
                      {offer.discount_type === "percentage"
                        ? `${offer.discount_value}%`
                        : `₹${offer.discount_value}`}
                    </span>
                    <span className="text-[10px] md:text-xs text-gray-600 dark:text-white font-semibold md:font-medium">OFF</span>
                  </div>
                  <span className="text-[10px] md:text-xs text-gray-700 dark:text-white hidden sm:inline truncate max-w-[120px]">
                    {offer.title}
                  </span>
                  <div className="w-1 h-1 md:w-1 md:h-1 rounded-full bg-[#D4AF37] hidden sm:block"></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Featured Collections */}
      {(isLoadingCollections || isLoadingProducts) ? (
        <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12 py-4 md:py-6 lg:py-8">
          <CollectionBannerSkeleton />
          <ProductSliderSkeleton count={4} />
        </section>
      ) : featuredCollections.length > 0 ? (
        <>
          {featuredCollections.map((collection) => {
            const collectionProducts = allProducts.length > 0
              ? collection.product_ids
                  .map((productId) => allProducts.find((p) => p.product_id === productId))
                  .filter((p): p is Product => p !== undefined)
              : [];

            // Don't hide collection if products haven't loaded yet - show empty state instead
            // if (collectionProducts.length === 0) return null;

            return (
              <section key={collection.id} className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-12 py-3 md:py-6 lg:py-8">
                <div className="text-left mb-2 md:mb-5">
                  <h2 className="font-serif text-lg md:text-3xl font-light mb-1 md:mb-1.5 tracking-tight px-2 md:px-4 text-gray-900 dark:text-white">
                    {collection.name}
                  </h2>
                  {collection.short_description && (
                    <p className="text-xs md:text-base text-gray-600 dark:text-gray-400 max-w-2xl px-2 md:px-4">
                      {collection.short_description}
                    </p>
                  )}
                </div>
                {/* Products Slider */}
                <HorizontalSlider
                  items={collectionProducts}
                  renderItem={renderProductItem}
                  cardWidth={176} // 160px card (mobile) + 16px gap
                  gap={16}
                  infiniteScroll={false}
                  showNavigation={collectionProducts.length > 2}
                  autoSlide={true}
                  autoSlideInterval={4000}
                  emptyMessage="No products in this collection"
                />
                {collectionProducts.length > 2 && (
                  <div className="text-center mt-2 md:mt-4">
                    <Button asChild variant="outline" className="border border-gray-300 dark:border-white active:border-[#D4AF37] dark:active:border-[#D4AF37] md:hover:border-[#D4AF37] dark:md:hover:border-[#D4AF37] px-3 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-medium rounded-md active:bg-[#D4AF37]/5 dark:active:bg-[#D4AF37]/5 md:hover:bg-[#D4AF37]/5 dark:md:hover:bg-[#D4AF37]/5 transition-all duration-300 touch-manipulation text-gray-900 dark:text-white active:text-[#D4AF37] dark:active:text-[#D4AF37] md:hover:text-[#D4AF37] dark:md:hover:text-[#D4AF37]">
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

      {/* How It's Made - Mobile Optimized */}
      <section className="bg-white dark:bg-black py-2 md:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 md:px-10 lg:px-12">
          <h2 className="font-serif text-sm md:text-2xl lg:text-3xl font-light text-center mb-2 md:mb-6 tracking-tight px-2 text-gray-900 dark:text-white">How It's Made</h2>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-5 lg:gap-6">
            <div className="text-center group">
              <div className="rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center mx-auto mb-1.5 md:mb-2.5 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-5 w-5 md:h-7 md:w-7 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-[10px] md:text-base font-medium mb-0.5 md:mb-1.5 text-gray-900 dark:text-white">Crafted</h3>
              <p className="text-gray-600 dark:text-gray-300 text-[9px] md:text-xs leading-tight max-w-sm mx-auto px-0.5 md:px-0 line-clamp-2 md:line-clamp-none">
                Handcrafted by skilled artisans with quality and attention to detail.
              </p>
            </div>
            <div className="text-center group">
              <div className="rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center mx-auto mb-1.5 md:mb-2.5 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-5 w-5 md:h-7 md:w-7 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-[10px] md:text-base font-medium mb-0.5 md:mb-1.5 text-gray-900 dark:text-white">Anti-tarnish</h3>
              <p className="text-gray-600 dark:text-gray-300 text-[9px] md:text-xs leading-tight max-w-sm mx-auto px-0.5 md:px-0 line-clamp-2 md:line-clamp-none">
                Advanced plating technology keeps your jewellery looking new for years.
              </p>
            </div>
            <div className="text-center group">
              <div className="rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center mx-auto mb-1.5 md:mb-2.5 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <Leaf className="h-5 w-5 md:h-7 md:w-7 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-[10px] md:text-base font-medium mb-0.5 md:mb-1.5 text-gray-900 dark:text-white">Sustainable</h3>
              <p className="text-gray-600 dark:text-gray-300 text-[9px] md:text-xs leading-tight max-w-sm mx-auto px-0.5 md:px-0 line-clamp-2 md:line-clamp-none">
                Ethical practices and sustainable materials for beauty that lasts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Mobile Optimized */}
      <section className="bg-gray-50 dark:bg-black py-3 md:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-12">
          <div className="text-center mb-3 md:mb-6 px-2">
            <h2 className="font-serif text-base md:text-3xl font-light mb-1 md:mb-1.5 tracking-tight text-gray-900 dark:text-white">What People Say About Us</h2>
            <p className="text-gray-600 dark:text-white/80 text-[10px] md:text-sm mb-2">
              You can also be featured!{" "}
              <button
                onClick={() => {
                  if (user) {
                    setShowReviewForm(true);
                  } else {
                    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
                    router.push("/login?callbackUrl=" + encodeURIComponent(currentPath));
                  }
                }}
                className="text-[#D4AF37] active:underline md:hover:underline font-semibold md:font-medium touch-manipulation text-[10px] md:text-sm"
              >
                Write a website review
              </button>
            </p>
          </div>

        {isLoadingReviews ? (
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 md:pb-4 scrollbar-hide">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-[200px] max-w-[200px] md:min-w-[240px] md:max-w-[240px] shrink-0">
                <ReviewCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <HorizontalSlider
            items={reviews}
            renderItem={renderReviewItem}
            cardWidth={216} // 200px card (mobile) + 16px gap
            gap={16}
            infiniteScroll={reviews.length > 2}
            showNavigation={reviews.length > 1}
            buttonSize="sm"
            autoSlide={true}
            autoSlideInterval={4000}
            emptyMessage="No reviews yet. Be the first to review!"
          />
        )}
        </div>
      </section>

      <ReviewForm open={showReviewForm} onOpenChange={setShowReviewForm} onReviewSubmitted={fetchReviews} />

      {/* Why Choose Vairanya - Mobile Optimized */}
      <section className="bg-gradient-to-br from-gray-50/50 to-white dark:from-black dark:to-black py-4 md:py-8 lg:py-10 border-t border-gray-100 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-10 lg:px-12">
          <h2 className="font-serif text-lg md:text-3xl font-light text-center mb-4 md:mb-8 tracking-tight px-2 text-gray-900 dark:text-white">Why Choose Vairanya</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-4 lg:gap-6">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-12 md:h-12 rounded-lg md:rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 mb-2 md:mb-2.5 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-6 w-6 md:h-6 md:w-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-sm md:text-lg font-medium mb-1 md:mb-1 text-gray-900 dark:text-white">Premium Quality</h3>
              <p className="text-gray-600 dark:text-gray-300 text-[10px] md:text-sm leading-relaxed px-1 md:px-0">
                Finest materials and craftsmanship
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-12 md:h-12 rounded-lg md:rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 mb-2 md:mb-2.5 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <Truck className="h-6 w-6 md:h-6 md:w-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-sm md:text-lg font-medium mb-1 md:mb-1 text-gray-900 dark:text-white">Free Shipping</h3>
              <p className="text-gray-600 dark:text-gray-300 text-[10px] md:text-sm leading-relaxed px-1 md:px-0">
                Over ₹999 with fast delivery
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-12 md:h-12 rounded-lg md:rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 mb-2 md:mb-2.5 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <RotateCcw className="h-6 w-6 md:h-6 md:w-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-sm md:text-lg font-medium mb-1 md:mb-1 text-gray-900 dark:text-white">Easy Returns</h3>
              <p className="text-gray-600 dark:text-gray-300 text-[10px] md:text-sm leading-relaxed px-1 md:px-0">
                30-day hassle-free policy
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-12 md:h-12 rounded-lg md:rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 dark:from-[#D4AF37]/20 dark:to-[#C19B2E]/10 mb-2 md:mb-2.5 group-active:scale-110 md:group-hover:scale-110 transition-transform duration-300">
                <Star className="h-6 w-6 md:h-6 md:w-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-sm md:text-lg font-medium mb-1 md:mb-1 text-gray-900 dark:text-white">Lifetime Care</h3>
              <p className="text-gray-600 dark:text-gray-300 text-[10px] md:text-sm leading-relaxed px-1 md:px-0">
                Expert guidance and support
              </p>
            </div>
          </div>
        </div>
      </section>

        <Footer />
      </main>
    </>
  );
}

