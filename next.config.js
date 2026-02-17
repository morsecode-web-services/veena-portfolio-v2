/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for GitHub Pages
  // Remove output: 'export' to support ISR on Netlify

  // Base path - Automatically handles GitHub Pages subfolders OR root domains (Netlify)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Asset prefix - Automatically handles GitHub Pages subfolders OR root domains (Netlify)
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Trailing slash for GitHub Pages compatibility
  trailingSlash: true,

  images: {
    // Enable image optimization (required for remotePatterns)
    unoptimized: false,
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
