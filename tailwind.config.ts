import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Professional color palette - deep blues, elegant grays, gold accents
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#14213d',
          950: '#0a1428', // Deepest navy for premium accents
        },
        // Refined gold palette for sophisticated luxury
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#b8860b', // DarkGoldenrod - more sophisticated
          600: '#8B6914', // WCAG AA compliant (4.51:1 contrast on cream)
          700: '#826008', // Refined darker shade
          800: '#6b4f06', // Premium deep gold
          900: '#4a3604', // Luxurious darkest gold
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        cream: {
          50: '#fefdfb',
          100: '#faf8f5',
          200: '#f5f2ed',
          300: '#f0ebe3',
          400: '#e8e1d5',
          500: '#ddd4c3',
          600: '#c9bca7',
          700: '#b0a08a',
          800: '#8f7f6d',
          900: '#6f6355',
        },
        // Elegant charcoal for quiet luxury
        charcoal: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        // @deprecated Legacy elegant shadows - Use 'premium' family instead for consistency
        // Kept for backward compatibility, will be removed in future version
        elegant: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'elegant-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'elegant-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

        // ✅ PREFERRED: Premium shadows for consistent quiet luxury aesthetic
        // Use these for all new components and when refactoring
        premium: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)', // Base - cards at rest
        'premium-md': '0 4px 8px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03)', // Medium - buttons, forms
        'premium-lg': '0 12px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)', // Large - hover states, modals
        'premium-xl': '0 20px 40px rgba(0, 0, 0, 0.10), 0 8px 16px rgba(0, 0, 0, 0.06)', // Extra large - lightboxes, overlays
      },
    },
  },
  plugins: [],
};
export default config;
