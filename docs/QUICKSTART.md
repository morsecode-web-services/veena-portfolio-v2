# Quick Start Guide

Get the Veena Musician Website up and running in 5 minutes!

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your website!

## 📝 Essential Configuration

### Update Site Content

Edit `public/config/site-config.json` to customize:

```json
{
  "artist": {
    "name": "Your Name",
    "tagline": "Your Tagline",
    "briefBio": "Short bio...",
    "fullBio": ["Paragraph 1", "Paragraph 2"]
  },
  "socialMedia": {
    "youtube": "https://youtube.com/@yourhandle",
    "instagram": "https://instagram.com/yourhandle"
  }
}
```

### Add Your Images

Place images in these folders:

- `public/images/home/hero-bg.jpg` (hero background)
- `public/images/home/veena-performance.jpg`
- `public/images/spotlight/veena.jpg` (veena spotlight image)
- `public/images/spotlight/vocal.jpg` (vocal spotlight image)
- `public/images/gallery/` (your performance photos)
- `public/images/press/` (press article images)
- `public/images/contact/contact-image.jpg` (contact section image)

### Update Video Links

In `site-config.json`, replace the placeholder YouTube URLs:

```json
"featuredVideos": [
  "https://www.youtube.com/embed/YOUR_VIDEO_ID_1",
  "https://www.youtube.com/embed/YOUR_VIDEO_ID_2",
  "https://www.youtube.com/embed/YOUR_VIDEO_ID_3"
]
```

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Check TypeScript

```bash
npm run type-check
```

### Lint Code

```bash
npm run lint
```

## 🏗️ Building for Production

### Create Production Build

```bash
npm run build
```

### Test Production Build Locally

```bash
npm run build
npm start
```

## 📦 Deployment

### Deploy to Vercel (Easiest)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Click "Deploy"

Done! Your site is live! 🎉

### Deploy to Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Build command: `npm run build`
6. Publish directory: `.next`
7. Click "Deploy"

## 🎨 Customization

### Change Colors

Edit `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    500: '#f15a20', // Your brand color
  },
}
```

### Modify Layout

Components are organized in:

- `components/sections/` - Page sections (Home, About, Gallery, etc.)
- `components/layout/` - Header, Footer, Navigation
- `components/ui/` - Reusable UI components

## 🆘 Common Issues

### Port 3000 Already in Use

```bash
# Use a different port
PORT=3001 npm run dev
```

### Styles Not Loading

```bash
# Clear cache and restart
rm -rf .next
npm run dev
```

### Build Errors

```bash
# Clean install
rm -rf node_modules .next
npm install
npm run build
```

## 📚 Next Steps

1. ✅ Customize `site-config.json`
2. ✅ Add your images
3. ✅ Update video links
4. ✅ Test locally
5. ✅ Deploy to Vercel/Netlify
6. ✅ Share your website!

## 💡 Tips

- **Development:** Changes auto-reload in dev mode
- **Images:** Use optimized images (WebP format recommended)
- **Videos:** Use YouTube embed URLs for best performance
- **Testing:** Run tests before deploying
- **Mobile:** Test on mobile devices for responsive design

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Hook Form Documentation](https://react-hook-form.com/)

## 📞 Need Help?

Check the full [README.md](./README.md) for detailed documentation.

---

**Happy Building! 🎵**
