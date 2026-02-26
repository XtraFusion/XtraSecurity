/**
 * Open Graph Image Generator Utility
 * 
 * This file provides utilities for generating OG images on-the-fly
 * if dynamic image generation is needed in the future
 * 
 * Current approach: Static og-image.png in /public/
 * Future: Can use dynamic generation if needed
 * 
 * Libraries to consider:
 * - next-og (simple)
 * - vercel/og (advanced)
 * - node-canvas (powerful)
 * - playwright (for screenshots)
 */

/**
 * TODO: Implement dynamic OG image generation
 * 
 * Example using next-og (recommended for Vercel):
 * 
 * npm install next-og
 * 
 * Then create app/og-image.tsx:
 * 
 * import { ImageResponse } from 'next-og'
 * 
 * export const runtime = 'edge'
 * export const alt = 'XtraSecurity'
 * export const size = { width: 1200, height: 630 }
 * 
 * export default async function Image() {
 *   return new ImageResponse(
 *     <div style={{
 *       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
 *       height: '100%',
 *       width: '100%',
 *       display: 'flex',
 *       alignItems: 'center',
 *       justifyContent: 'center',
 *       fontSize: 128,
 *       fontWeight: 'bold',
 *       color: 'white',
 *     }}>
 *       XtraSecurity
 *     </div>
 *   )
 * }
 */

/**
 * OG Image specifications
 */
export const OG_IMAGE_CONFIG = {
  // Static approach (current - recommended for simplicity)
  static: {
    path: '/og-image.png',
    width: 1200,
    height: 630,
    type: 'image/png',
    size: '< 5MB recommended',
    description: 'Pre-generated image static file',
    pros: ['Fast', 'Simple', 'No build overhead', 'CDN friendly'],
    cons: ['Not dynamic', 'Can\'t personalize', 'Same image for all pages'],
  },

  // Dynamic approach (future - for personalization)
  dynamic: {
    path: '/api/og-image',
    width: 1200,
    height: 630,
    type: 'image/png',
    runtime: 'edge',
    description: 'Generated on-demand with dynamic content',
    pros: ['Personalized', 'Dynamic data', 'A/B testable'],
    cons: ['Slower', 'More complex', 'Build cost', 'Requires serverless'],
  },
};

/**
 * Current approach: Use static image
 * Location: /public/og-image.png
 * 
 * To create this image:
 * 1. Open Canva.com
 * 2. Create custom size: 1200x630
 * 3. Design with:
 *    - Background gradient or solid color
 *    - XtraSecurity logo (centered)
 *    - Headline: "Professional Secrets Management"
 *    - Subheading: "Enterprise-Grade Security"
 *    - Brand colors (blues/purples)
 *    - Clean, professional design
 * 4. Export as PNG
 * 5. Optimize: https://tinypng.com/
 * 6. Save to: /public/og-image.png
 */

export interface OGImageDesignSpec {
  width: number;
  height: number;
  backgroundColor: string;
  logoSize: 'small' | 'medium' | 'large';
  headline: string;
  subheadline: string;
  includeGradient: boolean;
  gradientColors: string[];
}

export const DEFAULT_OG_DESIGN: OGImageDesignSpec = {
  width: 1200,
  height: 630,
  backgroundColor: '#1a1a2e',
  logoSize: 'large',
  headline: 'XtraSecurity',
  subheadline: 'Professional Secrets Management Platform',
  includeGradient: true,
  gradientColors: ['#667eea', '#764ba2', '#f093fb'],
};

/**
 * Tools for creating OG images
 */
export const OG_IMAGE_TOOLS = {
  browser: [
    {
      name: 'Canva',
      url: 'https://canva.com',
      cost: 'Free & Paid',
      difficulty: 'Easy',
      pros: ['User-friendly', 'Templates', 'No design skills needed'],
    },
    {
      name: 'Figma',
      url: 'https://figma.com',
      cost: 'Free & Paid',
      difficulty: 'Medium',
      pros: ['Professional', 'Team collaboration', 'Advanced design'],
    },
  ],
  ai: [
    {
      name: 'DALL-E',
      url: 'https://openai.com/dall-e',
      cost: 'Paid',
      difficulty: 'Easy',
      pros: ['AI generated', 'Unique', 'Customizable'],
    },
    {
      name: 'Midjourney',
      url: 'https://midjourney.com',
      cost: 'Paid',
      difficulty: 'Easy',
      pros: ['High quality', 'Fast', 'Versatile'],
    },
  ],
  programmatic: [
    {
      name: 'next-og',
      url: 'https://github.com/vercel/next-og',
      cost: 'Free',
      difficulty: 'Medium',
      pros: ['Built for Next.js', 'Edge runtime', 'Dynamic'],
    },
    {
      name: 'Vercel/og',
      url: 'https://vercel.com/api/og',
      cost: 'Paid',
      difficulty: 'Medium',
      pros: ['Enterprise', 'Reliable', 'Serverless'],
    },
    {
      name: 'node-canvas',
      url: 'https://github.com/Automattic/node-canvas',
      cost: 'Free',
      difficulty: 'Hard',
      pros: ['Full control', 'Powerful', 'Open source'],
    },
  ],
};

/**
 * Optimization tools for OG images
 */
export const OG_IMAGE_OPTIMIZATION = {
  compression: [
    {
      name: 'TinyPNG',
      url: 'https://tinypng.com/',
      type: 'Lossless compression',
    },
    {
      name: 'ImageOptim',
      url: 'https://imageoptim.com/',
      type: 'Local tool',
    },
    {
      name: 'Squoosh',
      url: 'https://squoosh.app/',
      type: 'Web-based',
    },
  ],
  validation: [
    {
      name: 'Facebook Sharing Debugger',
      url: 'https://developers.facebook.com/tools/debug/sharing/',
      description: 'Test OG image visibility',
    },
    {
      name: 'Twitter Card Validator',
      url: 'https://cards-dev.twitter.com/validator',
      description: 'Test Twitter Card',
    },
    {
      name: 'LinkedIn Inspector',
      url: 'https://www.linkedin.com/inspector/',
      description: 'Test LinkedIn preview',
    },
  ],
};

/**
 * Implementation roadmap
 */
export const IMPLEMENTATION_ROADMAP = {
  phase1_static: {
    timeline: 'Week 1',
    steps: [
      'Create og-image.png using Canva',
      'Optimize with TinyPNG',
      'Place in /public/og-image.png',
      'Test with Facebook debugger',
      'Verify on all social platforms',
    ],
  },

  phase2_dynamic: {
    timeline: 'Month 2 (Optional)',
    steps: [
      'Setup vercel/og or next-og',
      'Create dynamic image generation route',
      'Add page-specific titles to images',
      'Test various sizes/content',
      'Monitor performance impact',
    ],
  },

  phase3_optimization: {
    timeline: 'Month 3+',
    steps: [
      'A/B test different designs',
      'Monitor click-through rates',
      'Optimize based on analytics',
      'Add new variations',
      'Maintain brand consistency',
    ],
  },
};

export default OG_IMAGE_CONFIG;
