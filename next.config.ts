import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal Turbopack config to silence Next.js 16 error when webpack is present
  turbopack: {},

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
    ],
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
