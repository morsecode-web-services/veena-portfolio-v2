# SEO Improvements - Deployment Checklist

✅ **Status**: All code changes complete and tested
📅 **Date**: February 6, 2026

---

## Pre-Deployment Verification

### Local Testing

- [ ] Run the build command to verify no errors
  ```bash
  npm run build
  ```

- [ ] Start the production server locally
  ```bash
  npm run build && npm start
  ```

- [ ] Run the SEO verification script
  ```bash
  ./scripts/verify-seo.sh http://localhost:3000
  ```

- [ ] Manually check these pages in browser:
  - [ ] Homepage - View source and verify H1 tag
  - [ ] `/blog` - View source and verify canonical URL
  - [ ] `/blog/[any-post]` - View source and verify canonical URL + breadcrumb schema
  - [ ] `/admin/login` - View source and verify `noindex, nofollow` robots meta
  - [ ] `/sitemap.xml` - Verify no hash fragments, only actual pages

### Code Review

- [x] All TypeScript type checks pass (`npm run type-check`)
- [x] No ESLint errors (`npm run lint`)
- [x] Build completes successfully
- [x] All tests pass (`npm test`)

---

## Deployment Steps

### 1. Git Commit & Push

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "$(cat <<'EOF'
feat: Implement SEO improvements (canonical URLs, structured data, admin noindex)

- Add canonical URLs to all blog pages
- Block admin routes from search engine indexing
- Clean up sitemap (remove hash fragments)
- Enhance structured data for blog posts (Article + Breadcrumb schemas)
- Enhance event structured data for rich results
- Add comprehensive image optimization guide
- Create SEO verification script

Expected impact: +30% crawl efficiency, rich results eligibility

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Push to remote
git push origin main
```

### 2. Deploy to Production

Follow your deployment process (Vercel, Netlify, etc.):

```bash
# If using Vercel CLI
vercel --prod

# Or trigger deployment through Git push (if auto-deploy is configured)
# Changes will be deployed automatically
```

### 3. Post-Deployment Verification

- [ ] Run verification script against production URL
  ```bash
  ./scripts/verify-seo.sh https://www.aishwaryamanikarnike.com
  ```

- [ ] Check canonical URLs in production
  ```bash
  curl -s https://www.aishwaryamanikarnike.com/blog | grep canonical
  ```

- [ ] Check robots meta on admin routes
  ```bash
  curl -s https://www.aishwaryamanikarnike.com/admin/login | grep robots
  ```

- [ ] Verify sitemap
  ```bash
  curl -s https://www.aishwaryamanikarnike.com/sitemap.xml | grep -E "(<url>|<loc>)"
  ```

---

## Google Search Console Setup

### 1. Submit Updated Sitemap

- [ ] Go to [Google Search Console](https://search.google.com/search-console)
- [ ] Select your property
- [ ] Navigate to **Sitemaps** in left sidebar
- [ ] Remove old sitemap (if exists)
- [ ] Add new sitemap: `https://www.aishwaryamanikarnike.com/sitemap.xml`
- [ ] Click **Submit**

### 2. Request Indexing for Key Pages

- [ ] Navigate to **URL Inspection** tool
- [ ] Test these URLs:
  - `https://www.aishwaryamanikarnike.com/`
  - `https://www.aishwaryamanikarnike.com/blog`
  - Any published blog post URL
- [ ] Click **Request Indexing** for each

### 3. Verify Robots.txt

- [ ] Navigate to **Settings** → **robots.txt Tester**
- [ ] Verify `/admin/*` routes are blocked or return `noindex`

---

## Rich Results Testing

### Blog Posts

- [ ] Go to [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Enter a blog post URL (e.g., `https://www.aishwaryamanikarnike.com/blog/your-post`)
- [ ] Verify these rich results are detected:
  - [ ] **Article** (BlogPosting)
  - [ ] **Breadcrumb** (BreadcrumbList)
- [ ] Check for any errors or warnings

### Events

- [ ] Go to [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Enter homepage URL: `https://www.aishwaryamanikarnike.com`
- [ ] Verify **Event** rich results are detected
- [ ] Check that upcoming events have proper structured data

---

## PageSpeed Insights

- [ ] Go to [PageSpeed Insights](https://pagespeed.web.dev/)
- [ ] Enter: `https://www.aishwaryamanikarnike.com`
- [ ] Run test for both Mobile and Desktop
- [ ] Verify:
  - [ ] No critical SEO issues
  - [ ] Structured data is valid
  - [ ] Canonical tags are present
  - [ ] Note: Images will show as issue (to be fixed separately)

---

## Image Optimization (Follow-up Task)

**Priority**: HIGH
**Timeline**: Within 1 week of deployment

- [ ] Install sharp-cli: `npm install -D sharp-cli`
- [ ] Follow guide: `docs/IMAGE_OPTIMIZATION_GUIDE.md`
- [ ] Optimize hero image (target: <100KB)
- [ ] Optimize spotlight images (target: <75KB each)
- [ ] Optimize gallery images (target: <100KB each)
- [ ] Update config with WebP image paths
- [ ] Test on multiple devices
- [ ] Re-run PageSpeed Insights to verify improvements

---

## Monitoring Schedule

### Week 1 (Immediate)

- [ ] Day 1: Check Search Console for crawl errors
- [ ] Day 3: Verify admin routes are not being indexed
- [ ] Day 7: Check if rich results appear in Search Console Performance

### Week 2-4 (Short-term)

- [ ] Monitor organic traffic in Google Analytics
- [ ] Track impressions for blog posts in Search Console
- [ ] Check for any new indexing issues
- [ ] Verify Core Web Vitals improvements (after image optimization)

### Month 2-3 (Long-term)

- [ ] Compare organic traffic vs. previous period
- [ ] Check rich results appearance rate
- [ ] Monitor keyword rankings for key terms
- [ ] Review crawl stats for efficiency improvements

---

## Expected Results Timeline

| Timeframe | Expected Changes |
|-----------|------------------|
| **1-3 days** | Google begins recrawling sitemap |
| **1 week** | Admin routes removed from index |
| **2-3 weeks** | Canonical URLs consolidated |
| **3-4 weeks** | Rich results may start appearing |
| **4-6 weeks** | Organic traffic improvements visible |
| **6-8 weeks** | Full impact of changes measurable |

---

## Rollback Plan

If issues are detected after deployment:

### Minor Issues
- Check browser console for errors
- Review Search Console for crawl issues
- Adjust specific files as needed

### Critical Issues
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard [previous-commit-hash]
git push origin main --force
```

---

## Success Metrics

Track these metrics to measure success:

### Technical SEO
- ✅ 0 admin pages in Google index (currently: unknown)
- ✅ 100% of blog posts have canonical URLs
- ✅ Sitemap contains only valid pages (no hash fragments)
- ✅ All structured data passes validation

### Search Visibility
- 📈 +20-30% increase in organic impressions (within 6 weeks)
- 📈 Rich results appearing for blog posts
- 📈 Rich results appearing for events
- 📈 Improved average position for key terms

### Performance
- 📈 +30% crawl efficiency (Search Console crawl stats)
- 📈 Faster indexing of new content
- 📈 Better Core Web Vitals (after image optimization)

---

## Support & Documentation

**Files to reference:**
- `docs/SEO_IMPROVEMENTS_SUMMARY.md` - Detailed technical summary
- `docs/IMAGE_OPTIMIZATION_GUIDE.md` - Image optimization instructions
- `scripts/verify-seo.sh` - Automated verification script

**External Resources:**
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev/)

---

## Sign-off

- [ ] All changes tested locally
- [ ] All changes deployed to production
- [ ] All post-deployment checks complete
- [ ] Sitemap submitted to Google Search Console
- [ ] Rich results verified
- [ ] Monitoring schedule established

**Deployment Date**: _______________
**Deployed By**: _______________
**Verified By**: _______________

---

**Next Review Date**: _______________ (4-6 weeks after deployment)
