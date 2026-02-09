/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for GitHub Pages
  // Remove output: 'export' to support ISR on Netlify

  // Base path - set this to your repo name if deploying to username.github.io/repo-name
  // Leave empty string if deploying to username.github.io OR proper domain (Netlify/Vercel)
  // Only use base path in production if specifically needed
  basePath: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '') : '',

  // Asset prefix for GitHub Pages or other non-root deployments
  assetPrefix: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '') : '',

  // Trailing slash removed - causes issues with Next.js Image on Netlify
  trailingSlash: false,

  images: {
    // Serve images directly (already optimized by our script)
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ],
  },

  // Enable compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Optimize production builds

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize bundle size
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', 'react-icons'],
  },

  // Tree-shake react-icons to reduce bundle size
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },
}

module.exports = nextConfig
