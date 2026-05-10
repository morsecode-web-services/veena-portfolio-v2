# Veena Musician Website

A modern, responsive website for Veena musician Aishwarya Manikarnike, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🎵 Interactive music portfolio with categorized videos
- 📸 Image gallery with lightbox functionality
- 📰 Press articles showcase
- 💬 Contact form with validation
- 📄 Downloadable PDF portfolio
- 🎨 Smooth animations and transitions
- 📱 Fully responsive design
- ⚡ Optimized performance with lazy loading
- 🔒 Automated Telegram subscription system with Razorpay integration
- 🤖 Automated WhatsApp delivery for one-time Telegram invite links

## Tech Stack

- **Framework:** Next.js 14 (React 18)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Form Handling:** React Hook Form + Zod
- **PDF Generation:** jsPDF + html2canvas
- **Icons:** React Icons (Font Awesome)
- **Testing:** Vitest + React Testing Library + fast-check
- **Payments:** Razorpay
- **Automation:** Make.com (Webhooks + Telegram Bot + WhatsApp API)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd veena-musician-website
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the Site

Manage the site's content and structure through the **Admin Architect** dashboard. This controls:

- Artist information and biography
- Social media links
- Music categories and video URLs
- Press articles
- FAQ items
- Featured videos

### 4. Add Images

Place your images in the appropriate directories:

- `public/images/home/` - Home page images (hero-bg.jpg, veena-performance.jpg)
- `public/images/gallery/` - Gallery images
- `public/images/press/` - Press article images
- `public/images/contact/` - Contact section image
- `public/images/spotlight/` - Spotlight/featured images

### 5. Optimize Images

The project includes an automated image optimization script that compresses images for optimal web performance.

**Optimize all gallery images (default):**
```bash
npm run optimize-gallery
```

**Optimize a single file in gallery:**
```bash
npm run optimize-gallery gallery-5.jpg
```

**Optimize images in a custom directory:**
```bash
node scripts/optimize-gallery.js public/images/contact
```

**Optimize a specific file anywhere:**
```bash
node scripts/optimize-gallery.js public/images/contact/contact-image.jpg
```

**View help:**
```bash
node scripts/optimize-gallery.js --help
```

The script will:
- Resize images to max 1920px width (retina-ready)
- Compress to 85% quality (excellent visual quality)
- Convert HEIC/HEIF formats to JPEG
- Generate progressive JPEGs for faster loading
- Show file size savings report
- Works with any directory or file path

Typical results: **80-85% file size reduction** with no visible quality loss.

## Development

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the website.

The page will automatically reload when you make changes to the code.

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

### Start Production Server

```bash
npm run build
npm start
```

The production server will start on [http://localhost:3000](http://localhost:3000).

## Testing

### Run All Tests

```bash
npm test
```

This runs all unit tests and property-based tests using Vitest.

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Linting

```bash
npm run lint
```

This checks your code for potential errors and style issues.

## Project Structure

```
veena-musician-website/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── features/           # Feature components (ContactForm, PortfolioGenerator)
│   ├── layout/             # Layout components (Header, Footer, Navigation)
│   ├── sections/           # Page sections (Home, About, Gallery, etc.)
│   └── ui/                 # Reusable UI components
├── hooks/                   # Custom React hooks
│   ├── useScrollAnimation.ts
│   ├── useIntersectionObserver.ts
│   └── useLazyLoad.ts
├── lib/                     # Utility functions and services
│   ├── config.ts           # Configuration loader
│   ├── email-service.ts    # Email service integration
│   ├── pdf-generator.ts    # PDF generation logic
│   └── utils.ts            # Helper functions
├── public/                  # Static assets
│   ├── config/             # Configuration files
│   │   └── site-config.json
│   └── images/             # Image assets
│       ├── home/
│       ├── gallery/
│       └── press/
├── docs/                     # Project documentation and guides
├── emails/                   # Email templates
├── hooks/                   # Custom React hooks
```

## Configuration

### Site Configuration

The site is powered by a dynamic configuration system backed by **Supabase**.

### Admin Architect
Access the admin panel at `/admin` to modify:
- **Artist Profile**: Name, role, social links, and bio.
- **Site Structure**: Toggle sections and change their display order.
- **Design Settings**: Switch between "Carousel" and "Grid" modes for music, manage colors, and SEO.
- **Music Section Layout**: Choose between two display modes for the Music section:
- **Carousel (Default):** `"layout": "carousel"` - Modern, multi-select stacked carousel view.

```json
"music": {
  "layout": "carousel", 
  "categories": [...]
}
```

#### Structured Biography
The `artist.fullBio` field supports rich text formatting using blocks:
```json
"fullBio": [
  { "type": "paragraph", "content": "..." },
  { "type": "heading", "content": "..." },
  { "type": "list", "items": ["..."] }
]
```

#### Featured Carousel Image Positioning
Control how images are positioned in the featured carousel on mobile and desktop. This is useful when images have important content that gets cropped on different screen sizes (e.g., faces being cut off on mobile).

**Configuration:**
```json
"home": {
  "featuredCarousel": {
    "enabled": true,
    "items": [
      {
        "id": "featured-1",
        "image": "/images/spotlight/my-image.jpg",
        "imagePosition": "center",           // Desktop position (optional)
        "imagePositionMobile": "center top", // Mobile position (optional)
        "title": "My Title",
        "description": "Description text"
      }
    ]
  }
}
```

**Common Position Values:**

| Value | Description |
|-------|-------------|
| `"center"` | Center both horizontally and vertically (default) |
| `"top"` | Top center |
| `"bottom"` | Bottom center |
| `"left"` | Left center |
| `"right"` | Right center |
| `"center top"` | Horizontally centered, aligned to top |
| `"center bottom"` | Horizontally centered, aligned to bottom |
| `"left center"` | Vertically centered, aligned to left |
| `"right center"` | Vertically centered, aligned to right |
| `"top left"` | Top-left corner |
| `"top right"` | Top-right corner |
| `"bottom left"` | Bottom-left corner |
| `"bottom right"` | Bottom-right corner |

**Advanced Position Values:**

| Value Type | Example | Description |
|------------|---------|-------------|
| Percentage | `"50% 25%"` | X% from left, Y% from top |
| Pixels | `"10px 20px"` | Absolute pixel positioning |
| Mixed | `"center 30%"` | Combine keywords with percentages |

**Hero Stats with Line Breaks:**
The `home.heroStats[].value` field supports line breaks using `\n`:
```json
"heroStats": [
  {
    "label": "Recognition",
    "value": "'A'-Graded Musician\nAll India Radio"
  }
]
```

**Behavior:**
- If only `imagePosition` is specified, it applies to both mobile and desktop
- If only `imagePositionMobile` is specified, mobile uses it and desktop uses `"center"`
- If both are specified, each viewport uses its respective value
- If neither is specified, defaults to `"center"` for both

**Typical Use Case:**
```json
{
  "imagePosition": "center",
  "imagePositionMobile": "center top"
}
```
This keeps the image centered on desktop but shifts it to show the top portion on mobile, preventing heads or important content from being cropped.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure the build
4. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Connect your repository on [Netlify](https://netlify.com)
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Deploy!

### Deploy to Other Platforms

The project can be deployed to any platform that supports Node.js:

- AWS Amplify
- Google Cloud Platform
- Azure
- Self-hosted with Docker

## Environment Variables

If you need to add environment variables (e.g., for email service API keys):

1. Create a `.env.local` file in the root directory
2. Add your variables:

```env
NEXT_PUBLIC_EMAIL_SERVICE_KEY=your_key_here
EMAIL_SERVICE_TEMPLATE_ID=your_template_id
```

3. Access them in your code using `process.env.NEXT_PUBLIC_EMAIL_SERVICE_KEY`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimization

The website includes several performance optimizations:

- **Image Optimization:** Next.js Image component with automatic optimization
- **Lazy Loading:** Images and videos load on-demand
- **Code Splitting:** Automatic code splitting by Next.js
- **Hardware-Accelerated Animations:** Using CSS transforms and opacity
- **Responsive Images:** Multiple image sizes for different devices

## Accessibility

The website follows WCAG AA accessibility guidelines:

- Semantic HTML structure
- Proper heading hierarchy
- Keyboard navigation support
- ARIA labels where necessary
- Sufficient color contrast
- Descriptive alt text for images

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Delete `.next` directory: `rm -rf .next`
2. Delete `node_modules`: `rm -rf node_modules`
3. Reinstall dependencies: `npm install`
4. Try building again: `npm run build`

### TypeScript Errors

Check for TypeScript errors:

```bash
npx tsc --noEmit
```

### Tailwind CSS Not Working

If styles aren't applying:

1. Ensure `@import "tailwindcss";` is in `app/globals.css`
2. Check that `postcss.config.js` includes `@tailwindcss/postcss`
3. Restart the development server

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## Documentation

Detailed guides and implementation notes can be found in the [docs/](docs/) folder:

- [Razorpay Setup Guide](docs/RAZORPAY_SETUP_GUIDE.md)
- [Make.com Automation Guide](docs/MAKE_COM_SETUP_GUIDE.md)
- [Twilio WhatsApp Setup](docs/TWILIO_WHATSAPP_SETUP.md)
- [WhatsApp Cloud API Setup](docs/WHATSAPP_CLOUD_API_SETUP.md)
- [Leads Dashboard Guide](docs/LEADS_DASHBOARD_GUIDE.md)
- [GA4 Setup Guide](docs/GA4_SETUP_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## License

This project is private and proprietary.

## Support

For questions or issues, please contact the project maintainer.
