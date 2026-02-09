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

## Tech Stack

- **Framework:** Next.js 14 (React 18)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Form Handling:** React Hook Form + Zod
- **PDF Generation:** jsPDF + html2canvas
- **Icons:** React Icons (Font Awesome)
- **Testing:** Vitest + React Testing Library + fast-check

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

Edit the configuration file at `public/config/site-config.json` to customize:

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
├── types/                   # TypeScript type definitions
│   └── index.ts
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vitest.config.ts        # Vitest configuration
└── package.json            # Project dependencies
```

## Configuration

### Site Configuration

The main configuration file is located at `public/config/site-config.json`. It includes:

- **Artist Information:** Name, tagline, biography
- **Home Page:** Images and featured videos
- **Music Categories:** Veena, Vocal, 3 Generation Trio, RTP
- **Press Articles:** Title, publication, date, excerpt, URL
- **FAQ Items:** Questions and answers
- **Social Media:** Links to various platforms

### Tailwind Theme

Customize the theme in `tailwind.config.ts`:

- **Colors:** Primary and secondary color palettes
- **Fonts:** Custom font families
- **Animations:** Custom animation keyframes

### Feature Flags & Customization

You can toggle specific features and layouts in `public/config/site-config.json` under the `features` and `music` sections:

#### Music Section Layout
Choose between two display modes for the Music section:
- **Carousel (Default):** `"layout": "carousel"` - Modern, multi-select stacked carousel view.
- **Grid:** `"layout": "grid"` - Classic single-tab grid view.

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

## License

This project is private and proprietary.

## Support

For questions or issues, please contact:

- Email: [contact email]
- Website: [website URL]

## Acknowledgments

- Design inspired by modern musician portfolio websites
- Built with Next.js and the React ecosystem
- Icons from Font Awesome via react-icons
