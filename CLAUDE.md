# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 portfolio website for classical musician Aishwarya Manikarnike, featuring a public-facing site and an admin CMS. The site showcases performances, press coverage, events, and includes blog functionality. It uses Supabase for authentication, data storage, and dynamic content management.

## Key Commands

### Development
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking (no emit)
```

### Testing
```bash
npm test             # Run all tests (Vitest)
npm run test:watch   # Watch mode for tests
npm run test:coverage # Generate test coverage report
```

### Deployment
The site is configured for GitHub Pages deployment with basePath and assetPrefix handling. For production deployments:
- Set `NEXT_PUBLIC_BASE_PATH` environment variable if deploying to a subdirectory
- The site uses static export mode (when needed) and ISR capabilities

## Architecture Overview

### Configuration-Driven Design
The entire public site is powered by a central configuration file at `public/config/site-config.json`. This JSON file defines:
- Artist information and biography (supports structured blocks: paragraph, heading, list)
- Section ordering and visibility (`layoutOrder`, `sections`)
- Music layout mode: `"carousel"` (multi-select stacked) or `"grid"` (classic tabs)
- All content sections: Home, About, Gallery, Music, Press, FAQ, Contact

**Configuration Schema**: All config changes must conform to the Zod schemas defined in `lib/config.ts`. The `validateConfig()` function validates the entire site config on load.

### Path Handling System
The codebase uses a sophisticated path resolution system to handle multiple deployment targets:
- `getBasePath()`: Detects and returns the base path for the app (GitHub Pages subdirectory, custom domain, etc.)
- `getAssetPath(path)`: Normalizes any asset path by prepending the correct base path
- Always use `getAssetPath()` for images, config files, and static assets to ensure correct resolution across all environments

### Data Flow Architecture

**Public Site (app/page.tsx)**:
1. Server-side loads and validates `site-config.json`
2. Fetches dynamic data from Supabase (videos, events, blogs) using the anonymous client (`lib/supabase.ts`)
3. Uses ISR with 15-minute revalidation (`revalidate = 900`)
4. Passes config and data props to individual section components
5. Dynamic imports with loading states for heavy components (Gallery, Music, Press, FAQ, Contact)

**Admin CMS (app/admin/**)**:
- Client-side only (`'use client'`)
- Protected routes with auth check in `app/admin/layout.tsx`
- Role-based access: checks user profile for `admin` or `editor` role in Supabase `profiles` table
- Manages: Events, Blog Posts, Videos (all stored in Supabase)
- Uses TipTap rich text editor for blog content

### Component Organization

**Sections** (`components/sections/`): Full-page sections that consume config and display major site areas
- `Home.tsx`: Hero with stats, CTA, featured carousel, spotlights
- `About.tsx`: Artist biography with support for structured bio blocks
- `Gallery.tsx`: Image gallery with lightbox modal
- `Music.tsx`: Music videos organized by categories/subcategories (grid or carousel layout)
- `Schedule.tsx`: Upcoming events fetched from Supabase
- `Press.tsx`: Press articles from config
- `FAQ.tsx`: Collapsible FAQ items
- `Contact.tsx`: Contact form with EmailJS integration

**Features** (`components/features/`): Complex, self-contained functionality
- `ContactForm.tsx`: Form with React Hook Form + Zod validation, sends via EmailJS
- `PortfolioGenerator.tsx`: Client-side PDF generation using jsPDF + html2canvas
- `MusicCarousel.tsx`: Stacked multi-select carousel for music categories

**UI** (`components/ui/`): Reusable UI primitives
- `VideoPlayer.tsx`, `VideoEmbed.tsx`: YouTube video handling
- `ImageWithFallback.tsx`: Image component with error handling
- `ImageGallery.tsx`, `VideoModal.tsx`: Modals for media viewing

**Admin** (`components/admin/`): CMS-specific components
- `BlogForm.tsx`, `EventForm.tsx`: Forms for content management
- `TipTapEditor.tsx`: Rich text editor wrapper
- `ImageUpload.tsx`: Image compression and Supabase Storage upload

### Custom Hooks

**Performance Hooks** (`hooks/`):
- `useIntersectionObserver.ts`: Observe element visibility for lazy loading
- `useLazyLoad.ts`: Image lazy loading with IntersectionObserver
- `useScrollAnimation.ts`: Trigger animations on scroll
- `useWindowResize.ts`: Responsive behavior based on window size

### Library Functions

**Core Utilities** (`lib/`):
- `config.ts`: Config loading, validation, path resolution (Zod schemas)
- `email-service.ts`: EmailJS integration with retry logic and error handling
- `pdf-generator.ts`: PDF portfolio generation
- `performance.ts`: Performance optimization utilities
- `supabase.ts`: Anonymous Supabase client (public data fetching)
- `supabase-server.ts`: Server-side Supabase client (admin/auth operations)
- `events.ts`: Event date formatting and upcoming event logic

### Styling System

**Tailwind v4** with custom theme (`tailwind.config.ts`):
- Color palette: `navy`, `gold`, `cream`, `charcoal`, `slate` (all with 50-950 shades)
- Typography: `font-sans` (Inter), `font-serif` (Playfair Display)
- Custom shadows: `elegant`, `elegant-lg`, `premium`, `premium-lg`
- Custom animations: `fade-in`, `fade-in-up`, `slide-up`, `scale-in`

**Design Philosophy**: Quiet luxury aesthetic with subtle animations, elegant typography, and refined color palette.

## Working with Supabase

### Public Data Access
Use `lib/supabase.ts` (anonymous client) for public-facing data:
```typescript
import { supabase } from '@/lib/supabase';
// Fetch public data (videos, events, blogs)
const { data, error } = await supabase.from('videos').select('*');
```

### Admin/Auth Operations
Use `lib/supabase-server.ts` for server-side authenticated operations (admin routes, protected actions).

### Database Tables
- `profiles`: User roles (admin, editor)
- `videos`: Music videos with categories, subcategories, featured status, order_index
- `events`: Upcoming performances/events
- `blogs`: Blog posts with TipTap HTML content, cover images, metadata

## Environment Variables

Required for full functionality (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Database and auth
- `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`, `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`: Contact form
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics
- `NEXT_PUBLIC_CLARITY_PROJECT_ID`: Microsoft Clarity

## Testing

**Testing Stack**: Vitest + React Testing Library + fast-check (property-based testing)
- Unit tests: `lib/email-service.test.ts`, `lib/pdf-generator.test.ts`
- Component tests: `components/ErrorBoundary.test.tsx`
- Run tests with `npm test` before committing

## Common Patterns

### Adding a New Section
1. Create component in `components/sections/`
2. Add section to `layoutOrder` and `sections` in `site-config.json`
3. Update `app/page.tsx` switch statement to render the section
4. Add section to TypeScript types if needed

### Modifying Site Config Schema
1. Update Zod schemas in `lib/config.ts` (e.g., `SiteConfigSchema`)
2. Update TypeScript types in `types/index.ts`
3. Update `defaultConfig` fallback in `lib/config.ts`
4. Update `site-config.json` with new fields

### Working with Images
Always use `getAssetPath()` from `lib/config.ts` for static assets:
```typescript
import { getAssetPath } from '@/lib/config';
const imageSrc = getAssetPath(config.home.images.veena);
```

For Next.js Image component:
```typescript
<Image src={getAssetPath(imagePath)} alt="..." width={...} height={...} />
```

### Adding Database-Driven Content
1. Design Supabase table schema
2. Add TypeScript types to `types/` directory
3. Create utility functions in `lib/` for data fetching/formatting
4. Add admin UI in `app/admin/` for content management
5. Update public pages to fetch and display the data

## Performance Considerations

- Use dynamic imports with loading states for heavy components
- Images use lazy loading via `useLazyLoad` hook
- ISR caching (15-min revalidation) for public pages
- Hardware-accelerated animations (transform, opacity)
- Tree-shaking for react-icons imports
- Minimize use of `'use client'` boundaries - keep server components by default

## Accessibility

- Semantic HTML structure with proper landmarks
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast meets WCAG AA standards
- Descriptive alt text for images

## Git Workflow

Main branch: `main`
Feature development: Create feature branches, PR to `main`
