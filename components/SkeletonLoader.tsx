// Skeleton Loader Components for better loading UX

// Carousel Skeleton
export function CarouselSkeleton() {
  return (
    <div className="relative w-full h-[320px] md:h-[400px] lg:h-[450px] overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 animate-pulse">
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="max-w-xl space-y-3 md:space-y-4">
            {/* Badge skeleton */}
            <div className="h-6 w-32 bg-white/30 dark:bg-white/10 rounded-full"></div>
            {/* Title skeleton */}
            <div className="space-y-2">
              <div className="h-8 md:h-10 w-3/4 bg-white/30 dark:bg-white/10 rounded"></div>
              <div className="h-8 md:h-10 w-1/2 bg-[#D4AF37]/30 dark:bg-[#D4AF37]/20 rounded"></div>
            </div>
            {/* Buttons skeleton */}
            <div className="flex gap-2 pt-2">
              <div className="h-10 w-32 bg-white/30 dark:bg-white/10 rounded-lg"></div>
              <div className="h-10 w-24 bg-white/20 dark:bg-white/5 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Navigation dots skeleton */}
      <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        <div className="h-1.5 w-6 bg-white/50 dark:bg-white/30 rounded-full"></div>
        <div className="h-1.5 w-1.5 bg-white/30 dark:bg-white/10 rounded-full"></div>
        <div className="h-1.5 w-1.5 bg-white/30 dark:bg-white/10 rounded-full"></div>
      </div>
    </div>
  );
}

// Product Card Skeleton
export function ProductCardSkeleton() {
  return (
    <div className="glass-card rounded-xl md:rounded-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-800/50 dark:to-gray-900/50"></div>
      {/* Content skeleton */}
      <div className="p-3 md:p-3 space-y-2">
        <div className="h-3.5 md:h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-4 md:h-5 w-1/2 bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
      <div className="px-3 pb-3 md:pb-3">
        <div className="h-9 md:h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-xl md:rounded-md"></div>
      </div>
    </div>
  );
}

// Product Slider Skeleton
export function ProductSliderSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="min-w-[260px] max-w-[260px] shrink-0">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

// Collection Heading Skeleton (updated - no banner)
export function CollectionBannerSkeleton() {
  return (
    <div className="text-left mb-4 md:mb-5 animate-pulse px-4">
      <div className="h-7 md:h-8 lg:h-9 w-48 md:w-64 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
      <div className="h-3 md:h-4 w-full max-w-2xl bg-gray-200 dark:bg-gray-800 rounded"></div>
    </div>
  );
}

// Section Skeleton
export function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Title skeleton */}
      <div className="text-center space-y-2">
        <div className="h-7 md:h-8 w-48 md:w-64 bg-gray-200 dark:bg-gray-800 rounded mx-auto"></div>
        <div className="h-3 md:h-4 w-full max-w-md bg-gray-200 dark:bg-gray-800 rounded mx-auto"></div>
      </div>
      {/* Products skeleton */}
      <ProductSliderSkeleton />
    </div>
  );
}

// Review Card Skeleton
export function ReviewCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-2.5 md:p-4 shadow-sm border border-gray-200 dark:border-white/20 min-w-[200px] max-w-[200px] md:min-w-[240px] md:max-w-[240px] animate-pulse">
      <div className="flex gap-0.5 mb-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-2.5 w-2.5 md:h-3 md:w-3 bg-gray-300 dark:bg-white/20 rounded"></div>
        ))}
      </div>
      <div className="space-y-1.5 md:space-y-2 mb-2">
        <div className="h-2.5 md:h-3 w-full bg-gray-300 dark:bg-white/20 rounded"></div>
        <div className="h-2.5 md:h-3 w-5/6 bg-gray-300 dark:bg-white/20 rounded"></div>
        <div className="h-2.5 md:h-3 w-4/6 bg-gray-300 dark:bg-white/20 rounded"></div>
      </div>
      <div className="h-2.5 md:h-4 w-20 md:w-24 bg-gray-300 dark:bg-white/20 rounded"></div>
    </div>
  );
}

// Offers Skeleton
export function OffersSkeleton() {
  return (
    <div className="bg-gradient-to-r from-[#D4AF37]/5 via-[#C19B2E]/5 to-[#D4AF37]/5 dark:from-[#D4AF37]/10 dark:via-[#C19B2E]/10 dark:to-[#D4AF37]/10 py-2.5 md:py-5 border-y border-[#D4AF37]/10 dark:border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
        <div className="flex items-center justify-center gap-1.5 md:gap-3 flex-wrap animate-pulse px-1">
          <div className="h-3 md:h-4 w-20 md:w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-7 md:h-8 w-24 md:w-32 bg-white/60 dark:bg-white/10 rounded-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Checkout Page Skeleton
export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-black dark:via-black dark:to-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Order Summary Skeleton */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-white/10 p-4 md:p-6 space-y-6 animate-pulse">
              <div className="h-5 md:h-6 w-28 md:w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 md:gap-4">
                    <div className="h-16 w-16 md:h-20 md:w-20 bg-gray-200 dark:bg-gray-800 rounded flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 md:h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                      <div className="h-3 md:h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-white/10">
                <div className="flex justify-between">
                  <div className="h-3 md:h-4 w-16 md:w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-3 md:h-4 w-20 md:w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 md:h-4 w-12 md:w-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-3 md:h-4 w-16 md:w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-white/10">
                  <div className="h-4 md:h-5 w-20 md:w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-4 md:h-5 w-24 md:w-28 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Checkout Form Skeleton */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-white/10 p-4 md:p-6 space-y-6 animate-pulse">
              <div className="h-5 md:h-6 w-32 md:w-40 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="space-y-4">
                <div className="h-11 md:h-12 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="h-11 md:h-12 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="h-11 md:h-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-11 md:h-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
                <div className="h-11 md:h-12 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Account Page Skeleton - Profile
export function AccountProfileSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="h-20 md:h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        <div className="h-20 md:h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        <div className="h-20 md:h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      </div>
    </div>
  );
}

// Account Page Skeleton - Addresses
export function AccountAddressesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white dark:bg-[#0a0a0a] rounded-xl md:rounded-2xl border border-gray-200 dark:border-white/10 p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="h-5 md:h-6 w-28 md:w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-3.5 md:h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-3.5 md:h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-3.5 md:h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="flex gap-2 md:gap-3 pt-3 md:pt-4">
            <div className="h-9 md:h-10 w-16 md:w-20 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            <div className="h-9 md:h-10 w-16 md:w-20 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Account Page Skeleton - Orders
export function AccountOrdersSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="border-2 border-gray-200 dark:border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 md:h-6 w-28 md:w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-7 md:h-8 w-20 md:w-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          </div>
          <div className="h-16 md:h-20 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-20 md:h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-3 md:pt-4">
            <div className="h-3.5 md:h-4 w-28 md:w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-9 md:h-10 w-full sm:w-28 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Account Page Skeleton - Offers
export function AccountOffersSkeleton() {
  return (
    <div className="space-y-3 md:space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-[#0a0a0a] rounded-xl md:rounded-2xl border border-gray-200 dark:border-white/10 p-4 md:p-6">
          <div className="h-5 md:h-6 w-40 md:w-48 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
          <div className="h-3.5 md:h-4 w-full bg-gray-200 dark:bg-gray-800 rounded mb-3 md:mb-4"></div>
          <div className="h-9 md:h-10 w-28 md:w-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      ))}
    </div>
  );
}

// Login Page Skeleton
export function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-black dark:to-black px-4">
      <div className="w-full max-w-md space-y-6 animate-pulse">
        <div className="h-10 md:h-12 w-40 md:w-48 bg-gray-200 dark:bg-gray-800 rounded mx-auto"></div>
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-lg p-6 md:p-8 space-y-5 md:space-y-6 border border-gray-200 dark:border-white/10">
          <div className="h-10 md:h-11 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-10 md:h-11 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-11 md:h-12 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Product Grid Skeleton
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Loading More Products Skeleton
export function LoadingMoreSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

