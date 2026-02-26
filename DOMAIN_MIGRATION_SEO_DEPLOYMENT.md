# Domain Migration & SEO Deployment Guide
## From Current Domain to xtrasecurity.in
## Created: February 26, 2026

---

## 🚀 Deployment Checklist

### PHASE 1: Pre-Migration (Do Before Changing Domain)

#### Step 1: Code Deployments
```bash
# 1. Pull latest changes
git pull origin main

# 2. Verify SEO files exist:
# - lib/seo.ts ✓
# - lib/schema-markup.ts ✓
# - lib/search-engines-config.ts ✓
# - app/sitemap.ts ✓
# - app/robots.ts ✓
# - public/robots.txt ✓
# - public/sitemap.xml ✓

# 3. Test build locally
npm run build

# 4. Test development
npm run dev
# Visit http://localhost:3000
# Verify all pages load correctly
```

#### Step 2: Image Assets Required
Before going live, create and place these files in `/public`:
```
Required:
- og-image.png (1200x630px)

Already Present (Verify):
- favicon.ico
- favicon-16x16.png
- favicon-32x32.png
- apple-touch-icon.png
- android-chrome-192x192.png
- android-chrome-512x512.png
```

#### Step 3: Domain DNS Setup
Contact your domain registrar (xtrasecurity.in) and update:

For Vercel Deployment:
```
A Record: xtrasecurity.in → Vercel's IP (provided by Vercel)
CNAME: www.xtrasecurity.in → cname.vercel-dns.com

TXT Records (for verification):
- Google Search Console verification code
- Bing Webmaster verification code
```

For Other Hosting (e.g., AWS, Azure, Heroku):
```
A/CNAME records point to your hosting provider's servers
Consult your hosting provider's DNS documentation
```

---

### PHASE 2: Deployment (Moving to xtrasecurity.in)

#### Option A: Deploy to Vercel (Recommended)
```bash
# 1. Install Vercel CLI (if not already)
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel --prod

# 4. Connect Domain
# Go to https://vercel.com/dashboard
# - Select project
# - Settings → Domains
# - Add "xtrasecurity.in"
# - Follow domain verification steps
```

#### Option B: Deploy to Other Platforms
**AWS Amplify:**
```bash
# 1. Install Amplify CLI
npm install -g @aws-amplify/cli

# 2. Initialize
amplify init

# 3. Deploy
amplify publish

# 4. Connect domain in Amplify Console
```

**AWS EC2/ECS:**
- Build Docker image
- Deploy container
- Configure domain in Route 53
- Setup CloudFront for CDN

**Azure App Service:**
- Create resource group
- Deploy via GitHub Actions
- Add custom domain in App Service settings

**Heroku:**
```bash
# 1. Login
heroku login

# 2. Create app
heroku create xtrasecurity

# 3. Deploy
git push heroku main

# 4. Add domain
heroku domains:add xtrasecurity.in
```

---

### PHASE 3: Post-Deployment Verification

#### Step 1: Domain Verification (Day 1)
```
[ ] DNS propagation complete
    - Check: https://dnschecker.org/ (xtrasecurity.in)
    - Should show A/CNAME records pointing correctly
    - Allow 24-48 hours for full propagation

[ ] HTTPS/SSL working
    - Visit https://xtrasecurity.in
    - Should have valid certificate (no warnings)
    - Check: https://www.sslshopper.com/ssl-checker.html

[ ] Website loads correctly
    - Visit https://xtrasecurity.in
    - Check homepage
    - Check /login, /register, /docs, /security
    - Test mobile responsiveness
```

#### Step 2: Search Engine Setup (Day 1-2)
```
[ ] Google Search Console
    1. Go to https://search.google.com/search-console/about
    2. Click "Add property"
    3. Enter: https://xtrasecurity.in
    4. Verify ownership (choose method):
       - DNS TXT record (if admin of domain)
       - HTML file (upload to /public)
       - Google Analytics (if existing GA4)
    5. Add sitemap: https://xtrasecurity.in/sitemap.xml
    6. Set preferred domain: xtrasecurity.in (with https)
    7. Monitor "Coverage" report

[ ] Bing Webmaster Tools
    1. Go to https://www.bing.com/webmasters/about
    2. Sign in with Microsoft account
    3. Add site: https://xtrasecurity.in
    4. Verify with meta tag or XML file
    5. Submit sitemap

[ ] Yandex Webmaster (if targeting international)
    1. Go to https://webmaster.yandex.com/
    2. Add site: xtrasecurity.in
    3. Verify ownership
    4. Submit sitemap

[ ] Baidu (if targeting China)
    1. Go to https://zhanzhang.baidu.com/
    2. Add site
    3. Verify and submit sitemap
```

#### Step 3: Analytics Setup (Day 2-3)
```
[ ] Google Analytics 4
    1. Create property for xtrasecurity.in
    2. Get measurement ID: G-XXXXXXXXXX
    3. Add to lib/search-engines-config.ts:
       analyticsId: 'G-XXXXXXXXXXXXX'
    4. Redeploy application
    5. Verify tracking (wait 24 hours for data)
    6. Setup key events:
       - Sign up
       - Login
       - CTA clicks
       - Support contact

[ ] Google Tag Manager (Optional)
    1. Create GTM container
    2. Add container ID to site
    3. Configure events
    4. Deploy changes

[ ] Heatmap/Session Tools (Optional)
    - Hotjar
    - Clarity (Microsoft)
```

#### Step 4: Meta Tags Verification (Day 1)
```
[ ] Test Open Graph Tags
    1. Go to Facebook Sharing Debugger
       https://developers.facebook.com/tools/debug/sharing/
    2. Enter: https://xtrasecurity.in
    3. Verify image displays correctly
    4. Should show:
       - og:title: "XtraSecurity - Professional Secrets..."
       - og:description: "Enterprise-grade security..."
       - og:image: Shows og-image.png

[ ] Test Twitter Card
    1. Go to Twitter Card Validator
       https://cards-dev.twitter.com/validator
    2. Enter: https://xtrasecurity.in
    3. Verify Twitter preview looks correct

[ ] Test LinkedIn Preview
    1. Create LinkedIn post
    2. Paste: https://xtrasecurity.in
    3. Verify rich preview appears

[ ] Test WhatsApp Preview (optional)
    1. Send link in WhatsApp
    2. Verify preview shows image and title
```

#### Step 5: Schema Markup Validation (Day 2)
```
[ ] Google Rich Results Test
    1. Go to https://search.google.com/test/rich-results
    2. Enter: https://xtrasecurity.in
    3. Should show valid schema for:
       - Organization
       - Product
       - SoftwareApplication

[ ] Schema.org Validator
    1. Go to https://validator.schema.org/
    2. Enter: https://xtrasecurity.in
    3. Should show no errors or warnings
    4. Review structured data detected
```

#### Step 6: Performance & SEO Audit (Day 3)
```
[ ] Google PageSpeed Insights
    1. Go to https://pagespeed.web.dev/
    2. Enter: https://xtrasecurity.in
    3. Check scores:
       - Performance: > 70
       - Accessibility: > 90
       - Best Practices: > 90
       - SEO: = 100
    4. Fix any critical issues

[ ] GTmetrix Audit
    1. Go to https://gtmetrix.com/
    2. Enter: https://xtrasecurity.in
    3. Optimize if needed:
       - Minimize images
       - Enable caching
       - Reduce JS

[ ] Mobile-Friendly Test
    1. Go to https://search.google.com/test/mobile-friendly
    2. Enter: https://xtrasecurity.in
    3. Should pass Mobile Friendly test

[ ] SEO Audit (Optional - can use Ahrefs/SEMrush)
    1. Check title tags (all pages)
    2. Check meta descriptions
    3. Check header hierarchy (H1→H2→H3)
    4. Check internal links
    5. Check images have alt text
```

---

### PHASE 4: Old Domain Management (Within 30 Days)
**If migrating from old domain:**

```
[ ] Setup 301 Redirects
    # In next.config.mjs or server redirects:
    redirects: async () => {
      return [
        {
          source: '/(.*)',
          destination: 'https://xtrasecurity.in/:1',
          permanent: true, // 301 redirect
        },
      ]
    }

[ ] Update All References
    - [ ] Update links in email templates
    - [ ] Update links in social media profiles
    - [ ] Update links in documentation
    - [ ] Update links in API documentation
    - [ ] Update links in affiliate links
    - [ ] Update contact forms

[ ] Monitor Old Domain Search Console
    - [ ] Keep old domain property in Google Search Console
    - [ ] Monitor for errors for 3 months
    - [ ] Ensure 301 redirects are working
    - [ ] Check for new errors/issues

[ ] Remove Old Domain (After 6 months)
    - [ ] Confirm all traffic moved to new domain
    - [ ] Remove old domain DNS records
    - [ ] Let domain expire (don't renew)
    - [ ] Remove old property from Search Console (optional)
```

---

## 📊 Expected Timeline

| Phase | Duration | Activities |
|-------|----------|-----------|
| **Pre-Migration** | 1 week | Code completion, testing, DNS setup |
| **Deployment** | 1 day | Deploy to production |
| **DNS Propagation** | 24-48 hrs | Wait for DNS to fully propagate |
| **Verification** | 1 week | Verify all systems, fix issues |
| **Analytics Running** | 1 month | Collect baseline analytics |
| **Initial Indexing** | 1-3 months | Google indexes new domain |
| **Rankings Appear** | 3-6 months | Start seeing keyword rankings |
| **Full Impact** | 6-12 months | Core rankings established |

---

## ⚠️ Critical Warnings

1. **HTTP to HTTPS**
   - Ensure SSL certificate is properly installed
   - All traffic should redirect http → https
   - Test with https://www.sslchecker.com/

2. **Robots.txt & Sitemap**
   - Update file references if on subdomain
   - Current: https://xtrasecurity.in/robots.txt ✓
   - Current: https://xtrasecurity.in/sitemap.xml ✓

3. **Search Console**
   - Create NEW property (don't rename old)
   - Submit sitemap immediately
   - Monitor Coverage report for errors

4. **Backlinks**
   - If migrating from old domain:
     - Request backlink partners update URLs
     - Monitor in Search Console for old links
     - Setup 301 redirects for old URLs

5. **Email Domain**
   - If using xtrasecurity.in for email:
     - Setup SPF, DKIM, DMARC records
     - Verify email deliverability
     - Test with tools like MXToolbox.com

---

## 🔧 Troubleshooting

### Issue: Domain not resolving
```
Solution:
1. Check DNS records at https://dnschecker.org/
2. Wait 24-48 hours for propagation
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try different DNS: 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare)
```

### Issue: SSL Certificate error
```
Solution:
1. Check certificate at https://www.sslshopper.com/ssl-checker.html
2. If using Vercel: auto-generates, just wait
3. If using other hosting: request fresh certificate
4. Force HTTPS in next.config.mjs
```

### Issue: Pages not indexed in Google
```
Solution:
1. Verify domain in Google Search Console
2. Submit sitemap
3. Request indexing for key pages
4. Wait 1-2 weeks for indexing
5. Check for crawl errors in Search Console
```

### Issue: 404 on sitemap.xml
```
Solution:
1. Verify app/sitemap.ts exists
2. Build project: npm run build
3. Check public/sitemap.xml exists
4. Ensure robots.txt references correct URL
```

---

## ✅ Post-Deployment Monitoring

### Week 1 Checklist
- [ ] Domain resolves correctly
- [ ] HTTPS working
- [ ] Website functions properly
- [ ] Search console shows indexing
- [ ] Analytics tracking data
- [ ] No 404 errors in Search Console
- [ ] Sitemap submitted
- [ ] Robots.txt accessible

### Month 1 Checklist
- [ ] 30%+ pages indexed
- [ ] No critical crawl errors
- [ ] Core Web Vitals good
- [ ] Backlinks being discovered
- [ ] Analytics show organic traffic
- [ ] Email campaign announces new domain

### Month 3 Checklist
- [ ] 80%+ pages indexed
- [ ] Rankings appearing for some keywords
- [ ] Organic traffic growing
- [ ] Backlink profile growing
- [ ] Technical issues resolved

---

## 📞 Support

**Need Help?**
1. Check Google Search Central: https://developers.google.com/search
2. Consult Vercel Docs: https://vercel.com/docs
3. Review: SEO_IMPLEMENTATION_GUIDE.md (in root)
4. Review: SEO_IMPLEMENTATION_SUMMARY.md (in root)

---

**Document Version**: 1.0
**Last Updated**: February 26, 2026
**Status**: Ready for Deployment
