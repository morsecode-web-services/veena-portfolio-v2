# Contributing Guide

Thank you for your interest in contributing to the Veena Musician Website! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- A code editor (VS Code recommended)

### Initial Setup

1. **Fork and Clone**

```bash
git clone <your-fork-url>
cd veena-musician-website
```

2. **Install Dependencies**

```bash
npm install
```

3. **Start Development Server**

```bash
npm run dev
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates

### 2. Make Your Changes

Follow the project structure:

```
components/
├── features/    # Complex feature components
├── layout/      # Layout components
├── sections/    # Page sections
└── ui/          # Reusable UI components
```

### 3. Write Tests

- **Unit Tests:** For individual components and functions
- **Property Tests:** For universal behaviors using fast-check

Example unit test:

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

Example property test:

```typescript
import * as fc from 'fast-check';

describe('Configuration Validation', () => {
  it('validates all required fields', () => {
    fc.assert(
      fc.property(fc.record({
        name: fc.string(),
        email: fc.emailAddress(),
      }), (config) => {
        const result = validateConfig(config);
        expect(result.isValid).toBe(true);
      })
    );
  });
});
```

### 4. Run Tests and Checks

```bash
# Run all tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Build check
npm run build
```

### 5. Commit Your Changes

Follow conventional commit format:

```bash
git commit -m "feat: add new gallery lightbox feature"
git commit -m "fix: resolve mobile navigation issue"
git commit -m "docs: update README with deployment steps"
```

Commit types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test updates
- `chore:` - Build/config updates

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title and description
- Reference any related issues
- Screenshots for UI changes
- Test results

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types from `types/index.ts`

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

// Avoid
const Button = (props: any) => { ... }
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

```typescript
// Good
export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  );
};
```

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Use custom theme values from `tailwind.config.ts`
- Avoid inline styles

```typescript
// Good
<div className="flex flex-col md:flex-row gap-4 p-6">

// Avoid
<div style={{ display: 'flex', padding: '24px' }}>
```

### File Organization

- One component per file
- Co-locate tests with components (`.test.tsx`)
- Group related components in folders
- Use index files for clean imports

```
components/
└── ui/
    ├── Button/
    │   ├── Button.tsx
    │   ├── Button.test.tsx
    │   └── index.ts
    └── index.ts
```

## Testing Guidelines

### Unit Tests

- Test component rendering
- Test user interactions
- Test edge cases
- Mock external dependencies

### Property-Based Tests

- Test universal properties
- Use appropriate generators
- Run minimum 100 iterations
- Tag with property reference

```typescript
/**
 * Feature: veena-musician-website, Property 1: Configuration loading completeness
 * Validates: Requirements 2.1, 2.2
 */
it('loads all configuration fields', () => {
  fc.assert(
    fc.property(configGenerator, (config) => {
      const loaded = loadConfig(config);
      expect(loaded).toHaveProperty('artist');
      expect(loaded).toHaveProperty('socialMedia');
    }),
    { numRuns: 100 }
  );
});
```

### Test Coverage

- Aim for >80% coverage
- Focus on critical paths
- Don't test implementation details
- Test behavior, not structure

## Performance Guidelines

### Images

- Use Next.js Image component
- Provide width and height
- Use appropriate formats (WebP)
- Implement lazy loading

```typescript
import Image from 'next/image';

<Image
  src="/images/photo.jpg"
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
/>
```

### Animations

- Use hardware-accelerated properties
- Prefer `transform` and `opacity`
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly

```css
/* Good */
.animate {
  transform: translateY(0);
  opacity: 1;
  transition: transform 0.3s, opacity 0.3s;
}

/* Avoid */
.animate {
  top: 0;
  transition: top 0.3s;
}
```

### Code Splitting

- Use dynamic imports for heavy components
- Lazy load below-the-fold content
- Split by route automatically with Next.js

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

## Accessibility Guidelines

- Use semantic HTML
- Provide alt text for images
- Ensure keyboard navigation
- Maintain color contrast (WCAG AA)
- Add ARIA labels where needed

```typescript
// Good
<button aria-label="Close menu" onClick={closeMenu}>
  <CloseIcon />
</button>

// Avoid
<div onClick={closeMenu}>
  <CloseIcon />
</div>
```

## Documentation

- Update README for new features
- Add JSDoc comments for complex functions
- Document props with TypeScript
- Update CHANGELOG for releases

```typescript
/**
 * Validates the site configuration object
 * @param config - The configuration object to validate
 * @returns Validation result with errors if any
 */
export function validateConfig(config: SiteConfig): ValidationResult {
  // ...
}
```

## Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commits follow conventional format
- [ ] PR description is clear and complete

## Getting Help

- Check existing issues and PRs
- Read the full [README.md](./README.md)
- Review the [Design Document](.kiro/specs/veena-musician-website/design.md)
- Ask questions in PR comments

## Code Review Process

1. Automated checks run on PR
2. Maintainer reviews code
3. Address feedback
4. Approval and merge

## Release Process

1. Version bump in `package.json`
2. Update CHANGELOG
3. Create release tag
4. Deploy to production

Thank you for contributing! 🎉
