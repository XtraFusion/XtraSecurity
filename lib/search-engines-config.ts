/**
 * Search Engine Configuration
 * This file contains configurations for Google Search Console,
 * Bing Webmaster Tools, and other search engines
 * 
 * Update these values with your actual credentials and IDs
 */

export const searchEngineConfig = {
  // Google Configuration
  google: {
    siteUrl: 'https://xtrasecurity.in',
    verificationCode: 'GOOGLE_SITE_VERIFICATION_CODE', // Replace with actual code
    analyticsId: 'G-XXXXXXXXXX', // Google Analytics 4 property ID
    searchConsoleId: 'xtrasecurity.in', // Domain in Google Search Console
    // Verification methods:
    // 1. HTML file: Upload verification file to public folder
    // 2. HTML tag: Add to <head> in layout.tsx
    // 3. DNS record: Add TXT record to domain DNS
    // 4. Google Analytics: If Analytics snippet is already on site
    // 5. Google Tag Manager: If GTM is already implemented
  },

  // Bing Configuration
  bing: {
    siteUrl: 'https://xtrasecurity.in',
    verificationCode: 'BING_SITE_VERIFICATION_CODE', // Replace with actual code
    webmasterToolsId: 'xtrasecurity.in',
    // Bing uses similar verification methods as Google
  },

  // Other Search Engines
  yandex: {
    siteUrl: 'https://xtrasecurity.in',
    verificationCode: 'YANDEX_VERIFICATION_CODE',
    analyticsId: 'XXXXXXXX', // Yandex.Metrica ID
  },

  baidu: {
    siteUrl: 'https://xtrasecurity.in',
    verificationCode: 'BAIDU_VERIFICATION_CODE',
    // For Chinese market
  },

  // Sitemap locations
  sitemaps: [
    'https://xtrasecurity.in/sitemap.xml',
    'https://xtrasecurity.in/sitemap.json',
  ],

  // RSS feed (if applicable)
  rss: 'https://xtrasecurity.in/feed.xml',

  // Structured data (Schema.org)
  structuredData: {
    type: 'Organization',
    name: 'XtraSecurity',
    url: 'https://xtrasecurity.in',
    logo: 'https://xtrasecurity.in/placeholder-logo.svg',
  },
};

/**
 * Setup Instructions for Search Engines
 */
export const setupInstructions = {
  google: `
1. Open Google Search Console: https://search.google.com/search-console/about
2. Click "Start now"
3. Add property: xtrasecurity.in
4. Choose verification method:
   - Recommended: Google Analytics (if already implemented)
   - Alternative: DNS record verification
5. Submit XML sitemap from Search Console
6. Monitor indexing and errors
  `,

  bing: `
1. Open Bing Webmaster Tools: https://www.bing.com/webmasters/about
2. Sign in with Microsoft account
3. Add site: https://xtrasecurity.in
4. Verify ownership using:
   - XML file
   - DNS CNAME record
   - Meta tag
5. Submit sitemap
6. Configure crawl settings
  `,

  yandex: `
1. Open Yandex.Webmaster: https://webmaster.yandex.com/
2. Add site: xtrasecurity.in
3. Verify ownership
4. Submit sitemap
5. Install Yandex.Metrica for analytics
  `,

  googleAnalytics: `
1. Create Google Analytics 4 property
2. Add measurement ID: G-XXXXXXXXXX
3. Install gtag.py or use Google Tag Manager
4. Track key events:
   - Sign ups
   - Downloads (if any)
   - Form submissions
   - Page views by section
  `,
};

export default searchEngineConfig;
