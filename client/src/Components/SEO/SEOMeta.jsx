import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import MetaData from "./MetaData.js";

const BASE_URL = "https://www.mitsoft.edu.in";
const DEFAULT_IMAGE =
  `${BASE_URL}/favicon_new.png`;

const DEFAULT_DESC =
  "MIT School of Food Technology (MIT-SoFT), Pune offers B.Tech, M.Tech and Ph.D. programs in Food Technology, Food Science, Food Processing and Food Safety at MIT-ADT University.";

const DEFAULT_KEYWORDS =
  "MIT School of Food Technology, MIT SoFT, Food Technology College Pune, Food Technology Institute Pune, B.Tech Food Technology, M.Tech Food Technology, Ph.D Food Technology, Food Science, Food Processing, Food Safety, MIT ADT University";

const defaultSEO = {
  title:
    "MIT School of Food Technology (MIT-SoFT) | MIT-ADT University, Pune",
  desc: DEFAULT_DESC,
  keywords: DEFAULT_KEYWORDS,
  breadcrumbs: [],
};

const normalizePath = (path = "/") => {
  if (!path || path === "/") return "/";
  return `/${path.replace(/^\/+|\/+$/g, "")}`;
};

const SEOMeta = ({
  title,
  description,
  keywords,
  path = "/",
  image = DEFAULT_IMAGE,
  breadcrumbs,
}) => {
  const normalizedPath = normalizePath(path);

  const pageSEO = MetaData[normalizedPath] || defaultSEO;

  const pageTitle = title || pageSEO.title || defaultSEO.title;
  const fullTitle = pageTitle.includes("MIT-ADT University")
    ? pageTitle
    : `${pageTitle} | MIT School of Food Technology`;

  const metaDescription =
    description || pageSEO.desc || DEFAULT_DESC;

  const metaKeywords =
    keywords || pageSEO.keywords || DEFAULT_KEYWORDS;

  const pageBreadcrumbs =
    breadcrumbs || pageSEO.breadcrumbs || [];

  const canonicalUrl =
    normalizedPath === "/"
      ? `${BASE_URL}/`
      : `${BASE_URL}${normalizedPath}`;

  /*
   * Update the primary SEO tags already defined in index.html.
   * This prevents Helmet from creating duplicate primary tags.
   */
  useEffect(() => {
    const titleElement = document.getElementById("seo-title");
    const descriptionElement =
      document.getElementById("seo-description");
    const keywordsElement =
      document.getElementById("seo-keywords");
    const robotsElement =
      document.getElementById("seo-robots");
    const canonicalElement =
      document.getElementById("seo-canonical");

    if (titleElement) {
      titleElement.textContent = fullTitle;
    }

    if (descriptionElement) {
      descriptionElement.setAttribute("content", metaDescription);
    }

    if (keywordsElement) {
      keywordsElement.setAttribute("content", metaKeywords);
    }

    if (robotsElement) {
      robotsElement.setAttribute(
        "content",
        "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
      );
    }

    if (canonicalElement) {
      canonicalElement.setAttribute("href", canonicalUrl);
    }
  }, [fullTitle, metaDescription, metaKeywords, canonicalUrl]);

  const breadcrumbSchema =
    pageBreadcrumbs.length > 0
      ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${BASE_URL}/`,
          },
          ...pageBreadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 2,
            name: crumb.name,
            item: `${BASE_URL}${normalizePath(crumb.path)}`,
          })),
        ],
      }
      : null;

  return (
    <Helmet>
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta
        property="og:image:alt"
        content="MIT School of Food Technology - MIT-ADT University"
      />
      <meta
        property="og:site_name"
        content="MIT School of Food Technology"
      />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />

      {/* Breadcrumb structured data */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOMeta;
