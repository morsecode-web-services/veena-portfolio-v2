/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for GitHub Pages
  // Remove output: 'export' to support ISR on Netlify

  // Base path - Automatically handles GitHub Pages subfolders OR root domains (Netlify)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Asset prefix - Automatically handles GitHub Pages subfolders OR root domains (Netlify)
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Trailing slash removed - causes issues with Next.js Image on Netlify
  trailingSlash: false,

  images: {
    // GitHub Pages (static export) doesn't support image optimization
    // Netlify supports it natively - enable based on environment
    unoptimized: !!process.env.NEXT_PUBLIC_BASE_PATH,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },

  // Enable compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize bundle size
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', 'react-icons', 'lucide-react'],
  },

  // Tree-shake react-icons to reduce bundle size
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },
}

module.exports = nextConfig
