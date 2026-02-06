#!/bin/bash

# SEO Verification Script
# Tests implemented SEO improvements

echo "🔍 SEO Improvements Verification"
echo "================================="
echo ""

BASE_URL="${1:-http://localhost:3000}"

echo "Testing against: $BASE_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Canonical URL on blog listing
echo "1. Testing canonical URL on /blog..."
CANONICAL_BLOG=$(curl -s "$BASE_URL/blog" | grep -o '<link rel="canonical" href="[^"]*"' | head -1)
if [[ $CANONICAL_BLOG == *"canonical"* ]]; then
    echo -e "${GREEN}✓ Canonical URL found on /blog${NC}"
    echo "   $CANONICAL_BLOG"
else
    echo -e "${RED}✗ Canonical URL NOT found on /blog${NC}"
fi
echo ""

# Test 2: Robots meta on admin routes
echo "2. Testing robots meta on /admin/login..."
ROBOTS_ADMIN=$(curl -s "$BASE_URL/admin/login" | grep -o '<meta name="robots" content="[^"]*"' | head -1)
if [[ $ROBOTS_ADMIN == *"noindex"* ]]; then
    echo -e "${GREEN}✓ Robots noindex found on /admin/login${NC}"
    echo "   $ROBOTS_ADMIN"
else
    echo -e "${RED}✗ Robots noindex NOT found on /admin/login${NC}"
fi
echo ""

# Test 3: Sitemap structure
echo "3. Testing sitemap structure..."
SITEMAP_CONTENT=$(curl -s "$BASE_URL/sitemap.xml")
HASH_COUNT=$(echo "$SITEMAP_CONTENT" | grep -c "#")
BLOG_IN_SITEMAP=$(echo "$SITEMAP_CONTENT" | grep -c "/blog<")

if [[ $HASH_COUNT -eq 0 ]]; then
    echo -e "${GREEN}✓ No hash fragments in sitemap${NC}"
else
    echo -e "${RED}✗ Found $HASH_COUNT hash fragments in sitemap${NC}"
fi

if [[ $BLOG_IN_SITEMAP -gt 0 ]]; then
    echo -e "${GREEN}✓ /blog route found in sitemap${NC}"
else
    echo -e "${RED}✗ /blog route NOT found in sitemap${NC}"
fi
echo ""

# Test 4: Check for structured data on home page
echo "4. Testing structured data on home page..."
HOME_SCHEMA=$(curl -s "$BASE_URL" | grep -c "application/ld+json")
if [[ $HOME_SCHEMA -gt 0 ]]; then
    echo -e "${GREEN}✓ Found $HOME_SCHEMA structured data blocks on home page${NC}"
else
    echo -e "${RED}✗ No structured data found on home page${NC}"
fi
echo ""

# Test 5: Check H1 structure
echo "5. Testing heading structure..."
H1_COUNT=$(curl -s "$BASE_URL" | grep -o "<h1" | wc -l | tr -d ' ')
if [[ $H1_COUNT -eq 1 ]]; then
    echo -e "${GREEN}✓ Exactly one H1 tag found on home page${NC}"
elif [[ $H1_COUNT -eq 0 ]]; then
    echo -e "${RED}✗ No H1 tag found on home page${NC}"
else
    echo -e "${YELLOW}⚠ Multiple H1 tags found ($H1_COUNT)${NC}"
fi
echo ""

# Summary
echo "================================="
echo "Verification complete!"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy to production"
echo "2. Test with Google Rich Results Test: https://search.google.com/test/rich-results"
echo "3. Submit sitemap to Google Search Console"
echo "4. Run image optimization (see docs/IMAGE_OPTIMIZATION_GUIDE.md)"
echo "5. Monitor Search Console for improvements"
echo ""
