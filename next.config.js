/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for GitHub Pages
  output: 'export',

  // Base path - set this to your repo name if deploying to username.github.io/repo-name
  // Leave empty string if deploying to username.github.io OR proper domain (Netlify/Vercel)
  // Only use base path in production if specifically needed
  basePath: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '') : '',

  // Asset prefix for GitHub Pages or other non-root deployments
  assetPrefix: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '') : '',

  // Trailing slash for GitHub Pages compatibility
  trailingSlash: true,

  images: {
    // Disable image optimization for static export
    unoptimized: true,
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
    optimizePackageImports: ['framer-motion', 'react-icons'],
  },
}

module.exports = nextConfig
