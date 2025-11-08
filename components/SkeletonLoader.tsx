// Skeleton Loader Components for better loading UX

// Carousel Skeleton
export function CarouselSkeleton() {
  return (
    <div className="relative w-full h-[320px] md:h-[400px] lg:h-[450px] overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="max-w-xl space-y-3 md:space-y-4">
            {/* Badge skeleton */}
            <div className="h-6 w-32 bg-white/30 rounded-full"></div>
            {/* Title skeleton */}
            <div className="space-y-2">
              <div className="h-8 md:h-10 w-3/4 bg-white/30 rounded"></div>
              <div className="h-8 md:h-10 w-1/2 bg-[#D4AF37]/30 rounded"></div>
            </div>
            {/* Buttons skeleton */}
            <div className="flex gap-2 pt-2">
              <div className="h-10 w-32 bg-white/30 rounded-lg"></div>
              <div className="h-10 w-24 bg-white/20 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Navigation dots skeleton */}
      <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        <div className="h-1.5 w-6 bg-white/50 rounded-full"></div>
        <div className="h-1.5 w-1.5 bg-white/30 rounded-full"></div>
        <div className="h-1.5 w-1.5 bg-white/30 rounded-full"></div>
      </div>
    </div>
  );
}

// Product Card Skeleton
export function ProductCardSkeleton() {
  return (
    <div className="glass-card rounded-xl md:rounded-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-black/20 dark:to-black/20"></div>
      {/* Content skeleton */}
      <div className="p-3 md:p-3 space-y-2">
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-[#1a1a1a] rounded"></div>
        <div className="h-5 w-1/2 bg-gray-200 dark:bg-[#1a1a1a] rounded"></div>
      </div>
      <div className="px-3 pb-3 md:pb-3">
        <div className="h-10 w-full bg-gray-200 dark:bg-[#1a1a1a] rounded-xl md:rounded-md"></div>
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
      <div className="h-8 md:h-9 w-64 bg-gray-200 dark:bg-[#1a1a1a] rounded mb-2"></div>
      <div className="h-4 w-96 max-w-2xl bg-gray-200 dark:bg-[#1a1a1a] rounded"></div>
    </div>
  );
}

// Section Skeleton
export function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Title skeleton */}
      <div className="text-center space-y-2">
        <div className="h-8 w-64 bg-gray-200 rounded mx-auto"></div>
        <div className="h-4 w-96 bg-gray-200 rounded mx-auto"></div>
      </div>
      {/* Products skeleton */}
      <ProductSliderSkeleton />
    </div>
  );
}

// Review Card Skeleton
export function ReviewCardSkeleton() {
  return (
    <div className="bg-black dark:bg-[#0a0a0a] rounded-lg p-3 md:p-4 shadow-sm border border-white/20 dark:border-white/20 min-w-[240px] max-w-[240px] animate-pulse">
      <div className="flex gap-0.5 mb-2.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-3 w-3 bg-white/20 dark:bg-white/20 rounded"></div>
        ))}
      </div>
      <div className="space-y-2 mb-2.5">
        <div className="h-3 w-full bg-white/20 dark:bg-white/20 rounded"></div>
        <div className="h-3 w-5/6 bg-white/20 dark:bg-white/20 rounded"></div>
        <div className="h-3 w-4/6 bg-white/20 dark:bg-white/20 rounded"></div>
      </div>
      <div className="h-4 w-24 bg-white/20 dark:bg-white/20 rounded"></div>
    </div>
  );
}

// Offers Skeleton
export function OffersSkeleton() {
  return (
    <div className="bg-gradient-to-r from-[#D4AF37]/5 via-[#C19B2E]/5 to-[#D4AF37]/5 py-4 md:py-5 border-y border-[#D4AF37]/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap animate-pulse">
          <div className="h-4 w-24 bg-gray-300 rounded"></div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-32 bg-white/60 rounded-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Checkout Page Skeleton
export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary Skeleton */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-white p-6 space-y-6 animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-20 w-20 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <div className="h-5 w-24 bg-gray-200 rounded"></div>
                  <div className="h-5 w-28 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Checkout Form Skeleton */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-white p-6 space-y-6 animate-pulse">
              <div className="h-6 w-40 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-12 w-full bg-gray-200 rounded"></div>
                <div className="h-12 w-full bg-gray-200 rounded"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
                <div className="h-12 w-full bg-gray-200 rounded"></div>
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
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-24 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl"></div>
        <div className="h-24 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl"></div>
        <div className="h-24 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl"></div>
      </div>
    </div>
  );
}

// Account Page Skeleton - Addresses
export function AccountAddressesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-6 space-y-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded"></div>
          <div className="h-4 w-full bg-gray-200 dark:bg-[#1a1a1a] rounded"></div>
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-[#1a1a1a] rounded"></div>
          <div className="h-4 w-2/3 bg-gray-200 dark:bg-[#1a1a1a] rounded"></div>
          <div className="flex gap-3 pt-4">
            <div className="h-10 w-20 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl"></div>
            <div className="h-10 w-20 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Account Page Skeleton - Orders
export function AccountOrdersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between">
            <div className="h-6 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded"></div>
            <div className="h-8 w-24 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl"></div>
          </div>
          <div className="h-20 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl"></div>
          <div className="h-24 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl"></div>
          <div className="flex justify-between pt-4">
            <div className="h-4 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded"></div>
            <div className="h-10 w-28 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Account Page Skeleton - Offers
export function AccountOffersSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-6">
          <div className="h-6 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded mb-2"></div>
          <div className="h-4 w-full bg-gray-200 dark:bg-[#1a1a1a] rounded mb-4"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl"></div>
        </div>
      ))}
    </div>
  );
}

// Login Page Skeleton
export function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4">
      <div className="w-full max-w-md space-y-6 animate-pulse">
        <div className="h-12 w-48 bg-gray-200 rounded mx-auto"></div>
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="h-10 w-full bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
          <div className="h-12 w-full bg-gray-200 rounded"></div>
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

