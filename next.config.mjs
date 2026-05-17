/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Target modern browsers only — skip polyfills for ES2020+ features
  compiler: {
    // Remove console.log in production for smaller bundles
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'xtrasecurity.in',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // SEO Optimization
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  rewrites: async () => {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
  // BullMQ & Server-only dependencies
  serverExternalPackages: ["bullmq"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('bullmq');
    }
    
    // Suppress "Critical dependency: the request of a dependency is an expression"
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    return config;
  },
}

export default nextConfig
