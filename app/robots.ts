import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Default: Allow all crawlers ──
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/', '/.next/', '/node_modules/', '/dashboard/', '/projects/', '/settings/', '/profile/', '/teams/'],
        crawlDelay: 1,
      },

      // ── Search Engine Bots ──
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 1,
      },

      // ── AI / LLM Crawler Bots ──
      {
        userAgent: 'GPTBot',
        allow: ['/', '/about', '/how-it-works', '/use-cases', '/developers', '/docs', '/blog', '/comparisons', '/security', '/compliance', '/llms.txt'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/projects/', '/settings/', '/profile/', '/teams/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/about', '/how-it-works', '/use-cases', '/developers', '/docs', '/blog', '/comparisons', '/security', '/compliance', '/llms.txt'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/projects/', '/settings/', '/profile/', '/teams/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/about', '/how-it-works', '/use-cases', '/developers', '/docs', '/blog', '/comparisons', '/security', '/compliance', '/llms.txt'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/projects/', '/settings/', '/profile/', '/teams/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/about', '/how-it-works', '/use-cases', '/developers', '/docs', '/blog', '/comparisons', '/security', '/compliance', '/llms.txt'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/projects/', '/settings/', '/profile/', '/teams/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/about', '/how-it-works', '/use-cases', '/developers', '/docs', '/blog', '/comparisons', '/security', '/compliance', '/llms.txt'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/projects/', '/settings/', '/profile/', '/teams/'],
      },
      {
        userAgent: 'Applebot-Extended',
        allow: ['/', '/about', '/how-it-works', '/use-cases', '/developers', '/docs', '/blog', '/comparisons', '/security', '/compliance', '/llms.txt'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/projects/', '/settings/', '/profile/', '/teams/'],
      },
      {
        userAgent: 'CCBot',
        allow: ['/', '/about', '/how-it-works', '/use-cases', '/developers', '/docs', '/blog', '/comparisons', '/security', '/compliance', '/llms.txt'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/projects/', '/settings/', '/profile/', '/teams/'],
      },
      {
        userAgent: 'Bytespider',
        allow: ['/', '/about', '/how-it-works', '/use-cases', '/developers', '/docs', '/blog', '/comparisons', '/security', '/compliance', '/llms.txt'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/projects/', '/settings/', '/profile/', '/teams/'],
      },
      {
        userAgent: 'cohere-ai',
        allow: ['/', '/about', '/how-it-works', '/use-cases', '/developers', '/docs', '/blog', '/comparisons', '/security', '/compliance', '/llms.txt'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/projects/', '/settings/', '/profile/', '/teams/'],
      },

      // ── Block aggressive SEO scrapers ──
      {
        userAgent: 'MJ12bot',
        disallow: '/',
      },
      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
      {
        userAgent: 'SemrushBot',
        disallow: '/',
      },
    ],
    sitemap: ['https://xtrasecurity.in/sitemap.xml'],
  };
}
