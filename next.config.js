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
    // Use Cloudinary for image optimization via fetch mode
    // Auto WebP/AVIF conversion, CDN delivery, responsive sizing
    loader: 'custom',
    loaderFile: './lib/cloudinary-loader.js',
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

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize bundle size
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons', 'lucide-react'],
    after: true,
  },

  // Tree-shake react-icons to reduce bundle size
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },
}

module.exports = nextConfig
