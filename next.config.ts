import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },
  async headers() {
    return [
      // Dynamic routes that must never be cached
      {
        source: '/(dashboard|admin|api|login|register|forgot-password|reset-password|auth)(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      // Public storefront pages – cache for 30s, serve stale for 60s while revalidating
      {
        source: '/:slug((?!dashboard|admin|api|login|register|forgot-password|reset-password|auth|invoice).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' },
        ],
      },
    ]
  },
};

export default nextConfig;
