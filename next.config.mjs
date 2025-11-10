import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Image configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.imagekit.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
      // imgBB domains (for backward compatibility with existing products)
      {
        protocol: "https",
        hostname: "i.ibb.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ibb.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.firebasestorage.googleapis.com",
        pathname: "/**",
      },
      // Pixabay domains (temporary - for backward compatibility during migration)
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.pixabay.com",
        pathname: "/**",
      },
    ],
    // Optimize images for better performance
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
    // Enable image optimization loader
    loader: 'default',
    // Enable image optimization for remote images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ Add security headers and popup headers (Fixes Firebase window.close warning)
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const baseHeaders = [
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin-allow-popups", // allows Firebase popups to close safely
      },
      {
        key: "Cross-Origin-Embedder-Policy",
        value: "unsafe-none", // prevents isolation that breaks popup
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    // Add HSTS only in production
    if (isProduction) {
      baseHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: baseHeaders,
      },
    ];
  },

  // Disable/adjust fallbacks for client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        "fs/promises": false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
      };
    }
    
    // Ensure path aliases are resolved correctly (fixes Vercel build issues)
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "."),
    };
    
    return config;
  },
  
  // Optimize build for Vercel - exclude unnecessary files from tracing
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'tests/**/*',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.spec.tsx',
        '**/*.test.tsx',
        'playwright.config.ts',
        'playwright-report/**/*',
        'test-results/**/*',
        // Exclude large packages that Vercel handles automatically
        'node_modules/@opentelemetry/**/*',
        // Exclude dev dependencies
        'node_modules/typescript/**/*',
        'node_modules/@types/**/*',
      ],
    },
    // Mark firebase-admin and mongodb as external - Vercel handles these automatically
    // This prevents Next.js from trying to bundle them, which causes slow builds
    // Vercel's serverless functions have access to node_modules automatically
    serverComponentsExternalPackages: ['firebase-admin', 'mongodb'],
  },
};

export default nextConfig;

