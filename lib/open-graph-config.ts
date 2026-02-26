/**
 * Open Graph & Social Meta Tags Configuration
 * 
 * These tags are used by social media platforms to display
 * rich previews when links are shared.
 * 
 * All these are already implemented in:
 * - @/lib/seo.ts (metadata)
 * - @/app/layout.tsx (schema markup)
 * 
 * This file documents the implementation
 */

export const openGraphConfig = {
  // Basic Open Graph Tags
  og: {
    title: 'XtraSecurity - Professional Secrets Management Platform',
    description: 'Enterprise-grade security, compliance, and developer-first features.',
    image: '/og-image.png', // Create this image (1200x630px)
    imageAlt: 'XtraSecurity - Secrets Management Platform',
    url: 'https://xtrasecurity.in',
    type: 'website',
    siteName: 'XtraSecurity',
    // locale: 'en_US',
  },

  // Twitter Card Tags
  twitter: {
    card: 'summary_large_image',
    site: '@xtrasecurity', // Update with actual Twitter handle
    creator: '@xtrasecurity',
    title: 'XtraSecurity - Professional Secrets Management Platform',
    description: 'Enterprise-grade security for your secrets and credentials.',
    image: '/og-image.png',
  },

  // LinkedIn (uses Open Graph tags)
  linkedin: {
    // LinkedIn uses og:title, og:description, og:image
    // Already configured in og section above
  },

  // Facebook (uses Open Graph tags)
  facebook: {
    appId: 'YOUR_FACEBOOK_APP_ID', // Optional: for insights
    // Uses og:title, og:description, og:image, og:url
  },

  // WhatsApp (uses Open Graph tags)
  whatsapp: {
    // WhatsApp uses og:title, og:description, og:image
  },

  // Pinterest (uses schema + Open Graph)
  pinterest: {
    // Uses og:image and rich pins schema
  },
};

/**
 * Image Specifications for Social Media
 * 
 * Create these images for optimal performance:
 */
export const socialMediaImages = {
  openGraph: {
    filename: '/og-image.png',
    dimensions: '1200x630px',
    format: 'PNG or JPG',
    size: '< 5MB recommended',
    description: 'Main image for Facebook, LinkedIn, Twitter, etc.',
  },
  twitterCard: {
    filename: '/twitter-card.png',
    dimensions: '1200x675px',
    format: 'PNG or JPG',
    size: '< 5MB recommended',
    description: 'Optimized for Twitter display',
  },
  favicon: {
    filename: '/favicon.ico',
    dimensions: '64x64px or higher',
    description: 'Browser tab icon',
  },
  appleTouchIcon: {
    filename: '/apple-touch-icon.png',
    dimensions: '180x180px',
    description: 'iOS home screen icon',
  },
  androidIcon: {
    filename: '/android-chrome-192x192.png',
    filename_large: '/android-chrome-512x512.png',
    dimensions: '192x192px and 512x512px',
    description: 'Android home screen icons',
  },
};

/**
 * Steps to create OG Image:
 * 
 * 1. Using Canva:
 *    - Go to canva.com
 *    - Create custom size: 1200x630px
 *    - Design with:
 *      * XtraSecurity logo
 *      * Main headline
 *      * Key value proposition
 *      * Brand colors
 *    - Export as PNG
 *    - Save as /public/og-image.png
 * 
 * 2. Using Figma:
 *    - Create 1200x630px artboard
 *    - Design with brand guidelines
 *    - Export as PNG
 * 
 * 3. Using code (programmatic):
 *    - Use next-og (npm package)
 *    - Generate dynamic OG images
 */

export const implementationTodos = `
SOCIAL MEDIA & OG IMAGE SETUP CHECKLIST
========================================

1. IMAGE CREATION
   [ ] Create og-image.png (1200x630px)
   [ ] Create twitter-card.png (1200x675px) - optional
   [ ] Place images in /public/ folder
   [ ] Ensure images are optimized (< 5MB)

2. VERIFY OPEN GRAPH
   [ ] Use Facebook Sharing Debugger
     - https://developers.facebook.com/tools/debug/sharing/
     - Paste xtrasecurity.in
     - Verify image and text display correctly
   
   [ ] Use Twitter Card Validator
     - https://cards-dev.twitter.com/validator
     - Verify Twitter preview

3. SOCIAL MEDIA PROFILES
   [ ] Create/Update LinkedIn Company Page
     - Add website: xtrasecurity.in
     - Use OG image as cover
   [ ] Create/Update Twitter (@xtrasecurity)
     - Link to website
   [ ] Create Facebook Page (if applicable)
   [ ] Create GitHub organization (if applicable)

4. SHARING OPTIMIZATION
   [ ] Test all social platforms with Socially Awesome
   [ ] Verify link previews on:
     - Facebook
     - LinkedIn
     - Twitter
     - WhatsApp
     - Slack
     - Discord

5. SCHEMA MARKUP VALIDATION
   [ ] Validate schema with Schema.org validator
     - https://validator.schema.org/
   [ ] Check Google Rich Results Test
     - https://search.google.com/test/rich-results
`;

export default openGraphConfig;
