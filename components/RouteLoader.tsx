"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState(0);
  const prevPathnameRef = useRef(pathname);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pages where spinner should NOT be shown (exact matches and sub-routes)
  const excludedPaths = [
    '/', // Homepage
    '/admin', // Admin dashboard (and all admin sub-routes)
    '/worker/dashboard', // Worker dashboard
  ];

  // Check if current path should exclude spinner
  const shouldExcludeSpinner = (path: string): boolean => {
    if (!path) return false;
    
    // Check exact matches
    if (excludedPaths.includes(path)) {
      return true;
    }
    
    // Check if path starts with any excluded path (for sub-routes)
    // Special handling for /admin - exclude all admin routes
    if (path.startsWith('/admin')) {
      return true;
    }
    
    // Check other excluded paths
    return excludedPaths.some(excludedPath => {
      if (excludedPath === '/') return false; // Don't match everything for root
      return path.startsWith(excludedPath);
    });
  };

  useEffect(() => {
    // Listen for route changes via pathname changes
    const handleRouteChange = () => {
      // Don't show spinner if navigating to or from excluded paths
      if (shouldExcludeSpinner(pathname) || shouldExcludeSpinner(prevPathnameRef.current)) {
        setIsLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        return;
      }

      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Show loading animation
      setIsLoading(true);
      setLoadingKey((prev) => prev + 1);

      // Hide loader after 2 seconds (matching user's requirement)
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };

    // Check if pathname actually changed
    if (prevPathnameRef.current !== pathname) {
      handleRouteChange();
      prevPathnameRef.current = pathname;
    }

    // Also listen for Link clicks globally
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      if (link && link.getAttribute('href')?.startsWith('/')) {
        // Only show for internal links
        const href = link.getAttribute('href');
        if (href && href !== pathname) {
          // Don't show spinner if navigating to excluded paths
          if (!shouldExcludeSpinner(href)) {
            // Clear any existing timeout
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
            }

            // Show loading animation
            setIsLoading(true);
            setLoadingKey((prev) => prev + 1);

            // Hide loader after 2 seconds
            loadingTimeoutRef.current = setTimeout(() => {
              setIsLoading(false);
            }, 2000);
          }
        }
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleLinkClick, true);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-md">
      <div className="relative w-40 h-40 md:w-48 md:h-48">
        {/* Outer Golden Ring 1 - Spinning Counter-clockwise */}
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent"
          style={{
            borderTopColor: '#D4AF37',
            borderRightColor: '#D4AF37',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            animation: 'spinRing1 2s linear infinite',
            margin: '-4px',
          }}
        />

        {/* Outer Golden Ring 2 - Spinning Clockwise */}
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent"
          style={{
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#F4D03F',
            borderLeftColor: '#F4D03F',
            animation: 'spinRing2 2.5s linear infinite reverse',
            margin: '-12px',
          }}
        />

        {/* Outer Golden Ring 3 - Spinning Counter-clockwise */}
        <div
          className="absolute inset-0 rounded-full border-3 border-transparent"
          style={{
            borderTopColor: '#C19B2E',
            borderRightColor: '#C19B2E',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            animation: 'spinRing3 3s linear infinite',
            margin: '-20px',
            opacity: 0.6,
          }}
        />

        {/* Center Diamond Crystal - Spinning */}
        <div
          key={`diamond-${loadingKey}`}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            animation: 'spinDiamond 1.5s linear infinite',
          }}
        >
          {/* Diamond Shape */}
          <div className="relative w-20 h-20 md:w-24 md:h-24">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              className="drop-shadow-2xl"
            >
              {/* Outer diamond crystal */}
              <polygon
                points="50,8 92,50 50,92 8,50"
                fill={`url(#diamondGradient-${loadingKey})`}
                stroke="#C19B2E"
                strokeWidth="1.5"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.6))',
                }}
              />
              {/* Middle layer */}
              <polygon
                points="50,18 82,50 50,82 18,50"
                fill={`url(#diamondInnerGradient-${loadingKey})`}
                opacity="0.7"
              />
              {/* Inner shine */}
              <polygon
                points="50,25 75,50 50,75 25,50"
                fill={`url(#diamondHighlight-${loadingKey})`}
                opacity="0.4"
              />
              {/* Center highlight */}
              <circle
                cx="50"
                cy="50"
                r="8"
                fill="rgba(255, 255, 255, 0.6)"
                opacity="0.8"
              />
              
              {/* Gradient definitions */}
              <defs>
                <linearGradient id={`diamondGradient-${loadingKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                  <stop offset="30%" stopColor="#F4D03F" stopOpacity="1" />
                  <stop offset="60%" stopColor="#D4AF37" stopOpacity="1" />
                  <stop offset="100%" stopColor="#C19B2E" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`diamondInnerGradient-${loadingKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF9C4" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#FFD700" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id={`diamondHighlight-${loadingKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#FFD700" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Golden Sparkles around diamond - Static positions */}
        {[...Array(8)].map((_, i) => {
          const angle = (i * 45) * (Math.PI / 180);
          const radius = 55;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(${x - 4}px, ${y - 4}px)`,
              }}
            >
              <div 
                className="w-2 h-2 bg-[#D4AF37] rounded-full shadow-lg"
                style={{
                  animation: `sparkle 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  boxShadow: '0 0 6px rgba(212, 175, 55, 0.8)',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes spinDiamond {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spinRing1 {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spinRing2 {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spinRing3 {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0.5;
            transform: translate(var(--x), var(--y)) scale(0.9);
          }
          50% {
            opacity: 1;
            transform: translate(var(--x), var(--y)) scale(1.3);
          }
        }
      `}</style>
    </div>
  );
}

