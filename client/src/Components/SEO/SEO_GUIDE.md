# MIT-SoFT SEO Guide

Central reference for all SEO configuration, maintenance, and best practices.

---

## 1. Activating Google Search Console (GSC)

1. Go to https://search.google.com/search-console and add property `https://soft.mituniversity.ac.in`
2. Choose **HTML tag** verification method — copy the `content` value from the meta tag shown
3. Open `client/public/index.html`, find the GSC comment block and uncomment + replace the placeholder:
   ```html
   <meta name="google-site-verification" content="YOUR_ACTUAL_CODE_HERE" />
   ```
4. Deploy, then click **Verify** in GSC

### Submitting the Sitemap
After verification, in GSC go to **Sitemaps** and submit:
```
https://soft.mituniversity.ac.in/sitemap.xml
```
The sitemap auto-regenerates hourly via `server/generateSitemap.js` (triggered by `server/server.js`).

---

## 2. Activating Google Analytics 4 (GA4)

1. Go to https://analytics.google.com → create a new GA4 property for `soft.mituniversity.ac.in`
2. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)
3. Open `client/public/index.html`, find the GA4 comment block, uncomment it, and replace both `G-XXXXXXXXXX` occurrences:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX', { send_page_view: true });
   </script>
   ```
4. Deploy — GA4 will begin tracking page views automatically via `send_page_view: true`

> Core Web Vitals (LCP, CLS, FID) are already measured via `reportWebVitals.js`. To send them to GA4, update `client/src/index.js`:
> ```js
> reportWebVitals(({ name, value, id }) => {
>   window.gtag?.('event', name, { value, event_category: 'Web Vitals', event_label: id, non_interaction: true });
> });
> ```

---

## 3. SEO Architecture Overview

### Files
| File | Purpose |
|------|---------|
| `client/src/Components/SEO/MetaData.js` | Centralized metadata store — all page titles, descriptions, keywords |
| `client/src/Components/SEO/SEOMeta.jsx` | SEO component — renders Helmet tags + all JSON-LD schemas |
| `client/public/index.html` | Static fallback meta, EducationalOrganization + WebSite JSON-LD, GA4, GSC |
| `client/public/robots.txt` | Crawler directives — all admin routes blocked |
| `server/generateSitemap.js` | Dynamic sitemap generator (73 static + DB-driven dynamic URLs) |

### SEOMeta Props
| Prop | Type | Purpose |
|------|------|---------|
| `path` | string | Route path — used for MetaData lookup + canonical URL |
| `title` | string | Override page title |
| `description` | string | Override meta description |
| `keywords` | string | Override meta keywords |
| `image` | string | OG/Twitter image URL |
| `breadcrumbs` | array | `[{ name, path }]` — generates BreadcrumbList JSON-LD |
| `faqData` | array | `[{ question, answer }]` — generates FAQPage JSON-LD |
| `eventData` | object | `{ name, description, startDate, endDate, url }` — generates Event JSON-LD |
| `personData` | object | `{ name, designation, image, expertise }` — generates Person JSON-LD |
| `datePublished` | string | ISO date for Article schema |
| `noIndex` | boolean | Sets `noindex, nofollow` — used on 404 and admin pages |

### JSON-LD Schemas Generated
| Schema | Trigger |
|--------|---------|
| WebPage | Every public page |
| BreadcrumbList | When `breadcrumbs` prop has items |
| EducationalOrganization | Home page only (`/`) |
| Course | All `/programs/` paths |
| Article | Research + achievement paths |
| FAQPage | When `faqData` prop is passed (currently: `/admissions/faq`) |
| Event | When `eventData` prop is passed (currently: Events.jsx) |
| Person | When `personData` prop is passed (currently: Faculty.jsx modal) |

---

## 4. Adding a New Page — Checklist

1. **Add route** in `client/src/Routes/MainRoutes.jsx`
2. **Add metadata** in `client/src/Components/SEO/MetaData.js`:
   ```js
   "/your/new/path": {
     title: "Page Title",
     desc: "150–160 character description with primary keyword.",
     keywords: "keyword1, keyword2, keyword3",
   },
   ```
3. **Add SEOMeta** in the page component:
   ```jsx
   <SEOMeta path={location.pathname} breadcrumbs={[{ name: "Section", path: "/section" }, { name: title, path: location.pathname }]} />
   ```
4. **Add to sitemap** in `server/generateSitemap.js` → `STATIC_URLS` array
5. If the page has FAQs, pass `faqData` to SEOMeta
6. If it's a program page, it's auto-covered by `COURSE_PATHS` in SEOMeta.jsx

---

## 5. Heading Hierarchy Rules

Every page must follow this structure — Google uses headings to understand content hierarchy:

```
H1  — Page title (one per page, set by InnerBanner via the `title` prop)
H2  — Major section headings within the page content
H3  — Sub-sections or card titles within an H2 section
H4  — Minor labels (faculty names, board member names, etc.)
```

### Current Implementation
- **H1**: Rendered by `InnerBanner.jsx` as the banner title (one per page ✓)
- **H2**: Used for section headings like "Faculty Members", "Events", "Connect with Us" — use `className="innerpage-title"`
- **H3**: Used for sub-sections and card titles — use `className="innerpage-subtitle"` or semantic `<h3>`
- **H4**: Used for names, labels in cards

### Rules
- Never skip heading levels (e.g., H1 → H3 without H2)
- Never use headings purely for styling — use CSS classes instead
- The `<title>` tag (set by SEOMeta) is separate from H1 but should be semantically related

---

## 6. Image ALT Attribute Standards

All `<img>` tags must have descriptive `alt` attributes:

```jsx
// ✓ Good — descriptive
<img src={...} alt="Dr. Prerana Shere, Associate Professor, MIT School of Food Technology" />

// ✓ Good — contextual
<img src={...} alt={`${event.title} - campus event photo ${i + 1}`} />

// ✗ Bad — empty or generic
<img src={...} alt="" />
<img src={...} alt="image" />
```

### Pattern for CMS images
- Faculty: `alt={item.name}` (already implemented in Faculty.jsx ✓)
- Events: `alt={\`${event.title || "Campus event"} - ${i + 1}\`}` (already implemented in Events.jsx ✓)
- Recruiters/logos: `alt={\`${company.name} - recruiter at MIT SoFT\`}`
- Placed students: `alt={\`${student.name} - placed at ${student.company}\`}`

---

## 7. Canonical URL Strategy

- Canonical URLs are auto-generated in SEOMeta.jsx from the `path` prop
- Base URL: `https://soft.mituniversity.ac.in`
- Home: `https://soft.mituniversity.ac.in/`
- All others: `https://soft.mituniversity.ac.in{normalizedPath}`
- Trailing slashes are stripped by `normalizePath()`
- Query strings and hash fragments are stripped before canonicalization

**Duplicate content risk**: The `/programs` index route and `/programs/btech-food-technology/about-programs` both exist — they have distinct MetaData entries so canonical URLs are unique ✓

---

## 8. 404 Page

- File: `client/src/Pages/NotFound.jsx`
- Route: `*` catch-all in `MainRoutes.jsx`
- SEO: `noIndex={true}` → renders `noindex, nofollow`
- Note: React Router handles 404s client-side. The server returns HTTP 200 for all routes (SPA behavior). For true HTTP 404 status, configure your web server (Nginx/Apache) to return 404 for unknown static paths while still serving `index.html` for known SPA routes.

### Nginx example for true 404 status
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
# Return 404 for truly missing static assets
location ~* \.(js|css|png|jpg|gif|ico|svg|woff2?)$ {
  try_files $uri =404;
}
```

---

## 9. Core Web Vitals — Technical SEO

Already implemented:
- **Lazy loading**: All page components use `React.lazy()` + `Suspense` ✓
- **Image lazy loading**: `loading="lazy" decoding="async"` on faculty and event images ✓
- **Code splitting**: CRA automatically splits chunks per lazy import ✓
- **web-vitals**: Package installed, `reportWebVitals.js` ready ✓

Recommendations:
- Add `width` and `height` attributes to all `<img>` tags to prevent layout shift (CLS)
- Serve images in WebP format where possible
- Ensure the banner image (`/assets/banner_gif/inner_bnr.jpg`) has `fetchpriority="high"` since it is LCP candidate:
  ```jsx
  <img src={bgImage} fetchpriority="high" alt="MIT School of Food Technology campus" />
  ```
- Enable gzip/brotli compression on the Express server for JS/CSS assets

---

## 10. robots.txt Summary

Location: `client/public/robots.txt`

All `/admin/*` routes, `/api/*`, and `/*?*` (query strings) are blocked.
Sitemap is declared at the bottom:
```
Sitemap: https://soft.mituniversity.ac.in/sitemap.xml
```
