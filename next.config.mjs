import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // CACHE BUSTER: 2026-10-08
  output: "standalone",
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
    const makeHeader = (headerKey, headerVal) => ({ key: headerKey, value: headerVal });
    return [
      {
        source: '/:path*',
        headers: [
          makeHeader('X-DNS-Prefetch-Control', 'on'),
          makeHeader('X-Frame-Options', 'DENY'),
          makeHeader('X-Content-Type-Options', 'nosniff'),
          makeHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()'),
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
    
    // Explicitly configure @ alias for reliable cross-platform resolution
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };

    // Suppress "Critical dependency: the request of a dependency is an expression"
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    return config;
  },
}

export default nextConfig
