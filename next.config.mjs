/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image configuration for external domains
  images: {
    remotePatterns: [
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
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
        pathname: "/**",
      },
      // Allow local uploads if served from same domain
      {
        protocol: "https",
        hostname: "**",
        pathname: "/uploads/**",
      },
    ],
    // Optimize images for better performance
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // Enable image optimization for remote images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ Add headers for popup (Fixes Firebase window.close warning)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups", // allows Firebase popups to close safely
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none", // prevents isolation that breaks popup
          },
        ],
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
    return config;
  },
};

export default nextConfig;

