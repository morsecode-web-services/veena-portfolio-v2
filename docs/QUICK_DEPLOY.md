# Quick Deploy to GitHub Pages

## ✅ Latest Fix Applied
Config loading issue fixed! The site now correctly loads from `/veena-portfolio-v2/config/site-config.json`

## 🚀 Deploy in 3 Steps

### 1️⃣ Enable GitHub Pages
Go to: https://github.com/nageshraj/veena-portfolio-v2/settings/pages
- Set **Source** to: **GitHub Actions**
- Click **Save**

### 2️⃣ Push Your Code
```bash
git add .
git commit -m "Fix config loading and deploy to GitHub Pages"
git push origin main
```

### 3️⃣ Wait & Visit
- Monitor: https://github.com/nageshraj/veena-portfolio-v2/actions
- Visit: **https://nageshraj.github.io/veena-portfolio-v2/**

---

## ✅ What's Already Configured

- ✅ Static export enabled
- ✅ Base path set to `/veena-portfolio-v2`
- ✅ GitHub Actions workflow ready
- ✅ Config file in place
- ✅ All paths configured correctly

## 🔍 Verify After Deployment

Open: https://nageshraj.github.io/veena-portfolio-v2/

Check:
- [ ] Artist name visible
- [ ] Biography text showing
- [ ] Images loading
- [ ] Videos embedded
- [ ] Navigation working

## 🐛 If Something's Wrong

### Quick Checks:
1. **F12** → Console → Look for errors
2. **F12** → Network → Find `site-config.json` → Should be 200 OK
3. **Actions tab** → Check workflow succeeded
4. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Run Checker:
```bash
node check-deployment.js
```

## 📝 Update Content

Edit: `public/config/site-config.json`

Then:
```bash
git add public/config/site-config.json
git commit -m "Update content"
git push origin main
```

Auto-deploys in ~2 minutes!

## 📚 More Help

- `DEPLOYMENT_FIX_SUMMARY.md` - What was fixed
- `GITHUB_PAGES_SETUP.md` - Detailed setup
- `DEPLOYMENT_GUIDE.md` - Complete guide

---

**Your site will be live at:**
## https://nageshraj.github.io/veena-portfolio-v2/

🎉 Ready to deploy!
