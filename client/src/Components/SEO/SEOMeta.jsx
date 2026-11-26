import React from "react";
import { Helmet } from "react-helmet-async";
import MetaData from "./MetaData.js";

const BASE_URL = "https://soft.mituniversity.ac.in";
const DEFAULT_IMAGE = `${BASE_URL}/favicon_new.png`;
const DEFAULT_DESC =
  "MIT School of Food Technology (MIT-SoFT), Pune offers B.Tech, M.Tech and Ph.D. programs in Food Technology, Food Science, Food Processing and Food Safety at MIT-ADT University.";
const DEFAULT_KEYWORDS =
  "MIT School of Food Technology, MIT SoFT, Food Technology College Pune, Food Technology Institute Pune, B.Tech Food Technology, M.Tech Food Technology, Ph.D Food Technology, Food Science, Food Processing, Food Safety, MIT ADT University";

const defaultSEO = {
  title: "MIT School of Food Technology (MIT-SoFT) | MIT-ADT University, Pune",
  desc: DEFAULT_DESC,
  keywords: DEFAULT_KEYWORDS,
  breadcrumbs: [],
};

const normalizePath = (path = "/") => {
  if (!path || path === "/") return "/";
  const cleanPath = path.split("?")[0].split("#")[0];
  return `/${cleanPath.replace(/^\/+|\/+$/g, "")}`;
};

const getAbsoluteImageUrl = (image) => {
  if (!image) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(image)) return image;
  return `${BASE_URL}/${image.replace(/^\/+/, "")}`;
};

// ── JSON-LD schema builders ──────────────────────────────────────────────────

const buildBreadcrumbSchema = (breadcrumbs) => {
  if (!breadcrumbs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
      ...breadcrumbs.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: crumb.name,
        item: `${BASE_URL}${normalizePath(crumb.path)}`,
      })),
    ],
  };
};

const buildWebPageSchema = (canonicalUrl, title, description, breadcrumbs) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": canonicalUrl,
  url: canonicalUrl,
  name: title,
  description,
  isPartOf: { "@id": `${BASE_URL}/#website` },
  breadcrumb: breadcrumbs?.length ? buildBreadcrumbSchema(breadcrumbs) : undefined,
  inLanguage: "en-IN",
});

const buildEducationalOrgSchema = () => ({
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${BASE_URL}/#organization`,
  name: "MIT School of Food Technology",
  alternateName: "MIT-SoFT",
  url: `${BASE_URL}/`,
  logo: `${BASE_URL}/favicon_new.png`,
  image: `${BASE_URL}/favicon_new.png`,
  description: DEFAULT_DESC,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rajbaugh, Solapur-Pune Highway, Near Bharat Petrol Pump, Loni-Kalbhor",
    addressLocality: "Pune",
    addressRegion: "Maharashtra",
    postalCode: "412201",
    addressCountry: "IN",
  },
  telephone: "+91-9021080141",
  email: "admissions.mitsoft@mituniversity.edu.in",
  sameAs: ["https://www.mituniversity.ac.in"],
});

const buildCourseSchema = (title, description, canonicalUrl) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  name: title,
  description,
  url: canonicalUrl,
  provider: {
    "@type": "EducationalOrganization",
    name: "MIT School of Food Technology",
    url: `${BASE_URL}/`,
  },
  educationalLevel: "Higher Education",
  inLanguage: "en-IN",
});

const buildArticleSchema = (title, description, canonicalUrl, image, datePublished) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  url: canonicalUrl,
  image,
  datePublished: datePublished || new Date().toISOString().slice(0, 10),
  publisher: {
    "@type": "EducationalOrganization",
    name: "MIT School of Food Technology",
    logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon_new.png` },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
});

const buildEventSchema = (eventData) => ({
  "@context": "https://schema.org",
  "@type": "Event",
  name: eventData.name,
  description: eventData.description || "",
  startDate: eventData.startDate || new Date().toISOString().slice(0, 10),
  endDate: eventData.endDate || eventData.startDate || new Date().toISOString().slice(0, 10),
  location: {
    "@type": "Place",
    name: "MIT School of Food Technology",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pune",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
  },
  organizer: {
    "@type": "EducationalOrganization",
    name: "MIT School of Food Technology",
    url: `${BASE_URL}/`,
  },
  url: eventData.url || `${BASE_URL}/campus-life/events`,
});

const buildFAQSchema = (faqData) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer
        ? item.answer.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
        : "",
    },
  })),
});

const buildPersonSchema = (personData) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: personData.name,
  jobTitle: personData.designation || "",
  worksFor: {
    "@type": "EducationalOrganization",
    name: "MIT School of Food Technology",
    url: `${BASE_URL}/`,
  },
  ...(personData.image ? { image: getAbsoluteImageUrl(personData.image) } : {}),
  ...(personData.expertise ? { knowsAbout: personData.expertise } : {}),
});

// ── Path-to-schema-type mapping ──────────────────────────────────────────────

const COURSE_PATHS = new Set([
  "/programs",
  "/programs/btech-food-technology/about-programs",
  "/programs/btech-food-technology/future-scope",
  "/programs/btech-food-technology/eligibility",
  "/programs/btech-food-technology/syllabus-notes",
  "/programs/direct-2nd-year-btech/about-programs",
  "/programs/direct-2nd-year-btech/future-scope",
  "/programs/direct-2nd-year-btech/eligibility",
  "/programs/direct-2nd-year-btech/syllabus-notes",
  "/programs/mtech-food-technology/about-programs",
  "/programs/mtech-food-technology/future-scope",
  "/programs/mtech-food-technology/eligibility",
  "/programs/mtech-food-technology/syllabus-notes",
  "/programs/mtech-foodsafety/about-programs",
  "/programs/mtech-foodsafety/future-scope",
  "/programs/mtech-foodsafety/eligibility",
  "/programs/mtech-foodsafety/syllabus-notes",
  "/programs/mtech-food-technology-working-professional/about-programs",
  "/programs/mtech-food-technology-working-professional/future-scope",
  "/programs/mtech-food-technology-working-professional/eligibility",
  "/programs/mtech-food-technology-working-professional/syllabus-notes",
  "/programs/phd-food-technology/about-programs",
  "/programs/phd-food-technology/future-scope",
  "/programs/phd-food-technology/eligibility",
  "/programs/phd-food-technology/syllabus-notes",
]);

const ARTICLE_PATHS = new Set([
  "/research/research-paper-publication",
  "/research/funded-projects",
  "/research/consultancy-training",
  "/research/Patent-publications",
  "/academics/achievements",
  "/academics/vap-2022",
  "/academics/nep-2020",
]);

// ── Component ────────────────────────────────────────────────────────────────

const SEOMeta = ({
  title,
  description,
  keywords,
  path = "/",
  image = DEFAULT_IMAGE,
  breadcrumbs,
  // Optional: pass CMS-driven structured data
  eventData,    // { name, description, startDate, endDate, url }
  personData,   // { name, designation, image, expertise }
  faqData,      // [{ question, answer }] — triggers FAQPage schema
  datePublished,
  noIndex = false,
}) => {
  const normalizedPath = normalizePath(path);
  const pageSEO = MetaData[normalizedPath] || defaultSEO;

  const pageTitle = title || pageSEO.title || defaultSEO.title;
  const fullTitle = pageTitle.includes("MIT-ADT University")
    ? pageTitle
    : `${pageTitle} | MIT School of Food Technology`;

  const metaDescription = description || pageSEO.desc || DEFAULT_DESC;
  const metaKeywords = keywords || pageSEO.keywords || DEFAULT_KEYWORDS;
  const pageBreadcrumbs = breadcrumbs || pageSEO.breadcrumbs || [];

  const canonicalUrl =
    normalizedPath === "/" ? `${BASE_URL}/` : `${BASE_URL}${normalizedPath}`;
  const absoluteImageUrl = getAbsoluteImageUrl(image);

  const robotsContent = noIndex
    ? "noindex, nofollow"
    : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

  // Collect all JSON-LD schemas
  const schemas = [];

  // WebPage — every public page
  schemas.push(buildWebPageSchema(canonicalUrl, fullTitle, metaDescription, pageBreadcrumbs));

  // BreadcrumbList — when breadcrumbs exist
  if (pageBreadcrumbs.length > 0) {
    schemas.push(buildBreadcrumbSchema(pageBreadcrumbs));
  }

  // EducationalOrganization — home page only (avoid duplication)
  if (normalizedPath === "/") {
    schemas.push(buildEducationalOrgSchema());
  }

  // Course — program pages
  if (COURSE_PATHS.has(normalizedPath) || normalizedPath.startsWith("/programs/")) {
    schemas.push(buildCourseSchema(fullTitle, metaDescription, canonicalUrl));
  }

  // Article — research/news/achievement pages
  if (ARTICLE_PATHS.has(normalizedPath)) {
    schemas.push(buildArticleSchema(fullTitle, metaDescription, canonicalUrl, absoluteImageUrl, datePublished));
  }

  // Event — CMS-driven event data passed as prop
  if (eventData?.name) {
    schemas.push(buildEventSchema({ ...eventData, url: eventData.url || canonicalUrl }));
  }

  // Person — CMS-driven faculty/person data passed as prop
  if (personData?.name) {
    schemas.push(buildPersonSchema(personData));
  }

  // FAQ — CMS-driven FAQ data passed as prop
  if (faqData?.length > 0) {
    schemas.push(buildFAQSchema(faqData));
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>

      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />

      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:image:alt" content="MIT School of Food Technology - MIT-ADT University" />
      <meta property="og:site_name" content="MIT School of Food Technology" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@mitsoft" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={absoluteImageUrl} />

      {/* JSON-LD structured data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOMeta;
