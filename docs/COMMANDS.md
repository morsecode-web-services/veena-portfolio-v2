# Available Commands

Quick reference for all npm scripts and common commands.

## Development Commands

### Start Development Server
```bash
npm run dev
```
Starts the Next.js development server on http://localhost:3000 with hot module replacement.

### Build for Production
```bash
npm run build
```
Creates an optimized production build in the `.next` directory.

### Start Production Server
```bash
npm start
```
Starts the production server (requires `npm run build` first).

## Testing Commands

### Run All Tests
```bash
npm test
```
Runs all tests once using Vitest.

### Run Tests in Watch Mode
```bash
npm run test:watch
```
Runs tests in watch mode - automatically re-runs when files change.

### Run Tests with Coverage
```bash
npm run test:coverage
```
Runs tests and generates a coverage report.

## Code Quality Commands

### Lint Code
```bash
npm run lint
```
Checks code for errors and style issues using ESLint.

### Type Check
```bash
npm run type-check
```
Checks TypeScript types without emitting files.

## Utility Commands

### Install Dependencies
```bash
npm install
```
Installs all project dependencies from package.json.

### Update Dependencies
```bash
npm update
```
Updates dependencies to their latest versions within semver ranges.

### Check for Outdated Packages
```bash
npm outdated
```
Lists packages that have newer versions available.

### Audit Security
```bash
npm audit
```
Checks for security vulnerabilities in dependencies.

### Fix Security Issues
```bash
npm audit fix
```
Automatically fixes security vulnerabilities where possible.

## Clean Commands

### Clean Build Directory
```bash
rm -rf .next
```
Removes the Next.js build directory.

### Clean Node Modules
```bash
rm -rf node_modules
npm install
```
Removes and reinstalls all dependencies (useful for troubleshooting).

### Clean Everything
```bash
rm -rf .next node_modules package-lock.json
npm install
```
Complete clean install (use when things are really broken).

## Git Commands

### Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### Commit Changes
```bash
git add .
git commit -m "feat: your commit message"
```

### Push Changes
```bash
git push origin feature/your-feature-name
```

### Pull Latest Changes
```bash
git pull origin main
```

## Docker Commands (if using Docker)

### Build Docker Image
```bash
docker build -t veena-website .
```

### Run Docker Container
```bash
docker run -p 3000:3000 veena-website
```

## Deployment Commands

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

## Debugging Commands

### Check Node Version
```bash
node --version
```

### Check npm Version
```bash
npm --version
```

### List Installed Packages
```bash
npm list --depth=0
```

### Check for TypeScript Errors
```bash
npx tsc --noEmit
```

### Analyze Bundle Size
```bash
npm run build
# Then check the output for bundle sizes
```

## Environment Commands

### Copy Environment Template
```bash
cp .env.example .env.local
```

### View Environment Variables
```bash
cat .env.local
```

## Quick Workflows

### Fresh Start
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Pre-Commit Check
```bash
npm run lint
npm run type-check
npm test
```

### Pre-Deploy Check
```bash
npm run lint
npm run type-check
npm test
npm run build
```

### Full Test Suite
```bash
npm run lint && npm run type-check && npm test && npm run build
```

## Port Management

### Use Different Port
```bash
PORT=3001 npm run dev
```

### Kill Process on Port 3000 (macOS/Linux)
```bash
lsof -ti:3000 | xargs kill -9
```

### Kill Process on Port 3000 (Windows)
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Performance Commands

### Analyze Bundle
```bash
npm run build
# Check the output for bundle analysis
```

### Check Lighthouse Score
```bash
# Install Lighthouse CLI
npm i -g lighthouse

# Run Lighthouse
lighthouse http://localhost:3000 --view
```

## Maintenance Commands

### Update Next.js
```bash
npm install next@latest react@latest react-dom@latest
```

### Update All Dependencies
```bash
npm update
npm audit fix
```

### Check for Breaking Changes
```bash
npm outdated
# Review major version updates carefully
```

## Troubleshooting Commands

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### Clear npm Cache
```bash
npm cache clean --force
```

### Reinstall Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Check for Port Conflicts
```bash
lsof -i :3000
```

## Tips

- Use `npm run` to see all available scripts
- Add `--help` to most commands for more options
- Use `&&` to chain commands: `npm run lint && npm test`
- Use `||` for fallback: `npm test || echo "Tests failed"`

## Keyboard Shortcuts (in terminal)

- `Ctrl + C` - Stop running process
- `Ctrl + Z` - Suspend process
- `Ctrl + L` - Clear terminal
- `↑` / `↓` - Navigate command history

---

For more detailed information, see:
- [README.md](./README.md) - Full documentation
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guidelines
