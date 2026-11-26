const fs = require("fs");
const path = require("path");
const db = require("./config/db");

const BASE_URL = "https://www.mitsoft.edu.in";

// Static public pages with their SEO priorities
const STATIC_URLS = [
  { url: "/", changefreq: "weekly", priority: "1.0" },
  { url: "/aboutus/about-mit", changefreq: "monthly", priority: "0.8" },
  { url: "/aboutus/about-soft", changefreq: "monthly", priority: "0.8" },
  { url: "/aboutus/founder-message", changefreq: "monthly", priority: "0.6" },
  { url: "/aboutus/president-message", changefreq: "monthly", priority: "0.6" },
  { url: "/aboutus/leadership-message", changefreq: "monthly", priority: "0.7" },
  { url: "/aboutus/principal-message", changefreq: "monthly", priority: "0.7" },
  { url: "/aboutus/board-of-management", changefreq: "monthly", priority: "0.6" },
  { url: "/aboutus/governing-body", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/btech-food-technology/about-programs", changefreq: "monthly", priority: "0.9" },
  { url: "/programs/btech-food-technology/future-scope", changefreq: "monthly", priority: "0.7" },
  { url: "/programs/btech-food-technology/eligibility", changefreq: "monthly", priority: "0.7" },
  { url: "/programs/btech-food-technology/syllabus-notes", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/direct-2nd-year-btech/about-programs", changefreq: "monthly", priority: "0.8" },
  { url: "/programs/direct-2nd-year-btech/future-scope", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/direct-2nd-year-btech/eligibility", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/direct-2nd-year-btech/syllabus-notes", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/mtech-food-technology/about-programs", changefreq: "monthly", priority: "0.9" },
  { url: "/programs/mtech-food-technology/future-scope", changefreq: "monthly", priority: "0.7" },
  { url: "/programs/mtech-food-technology/eligibility", changefreq: "monthly", priority: "0.7" },
  { url: "/programs/mtech-food-technology/syllabus-notes", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/mtech-foodsafety/about-programs", changefreq: "monthly", priority: "0.8" },
  { url: "/programs/mtech-foodsafety/future-scope", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/mtech-foodsafety/eligibility", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/mtech-foodsafety/syllabus-notes", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/mtech-food-technology-working-professional/about-programs", changefreq: "monthly", priority: "0.8" },
  { url: "/programs/mtech-food-technology-working-professional/future-scope", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/mtech-food-technology-working-professional/eligibility", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/mtech-food-technology-working-professional/syllabus-notes", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/phd-food-technology/about-programs", changefreq: "monthly", priority: "0.8" },
  { url: "/programs/phd-food-technology/future-scope", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/phd-food-technology/eligibility", changefreq: "monthly", priority: "0.6" },
  { url: "/programs/phd-food-technology/syllabus-notes", changefreq: "monthly", priority: "0.6" },
  { url: "/academics/programme-outcomes", changefreq: "monthly", priority: "0.7" },
  { url: "/academics/academic-calendar", changefreq: "monthly", priority: "0.8" },
  { url: "/academics/faculty-information", changefreq: "monthly", priority: "0.8" },
  { url: "/academics/vac", changefreq: "monthly", priority: "0.7" },
  { url: "/academics/mou", changefreq: "monthly", priority: "0.6" },
  { url: "/academics/nep-2020", changefreq: "monthly", priority: "0.6" },
  { url: "/academics/vap-2022", changefreq: "monthly", priority: "0.6" },
  { url: "/academics/curriculum-feedback", changefreq: "monthly", priority: "0.6" },
  { url: "/academics/student-grievance", changefreq: "monthly", priority: "0.6" },
  { url: "/academics/lab-facilities", changefreq: "monthly", priority: "0.8" },
  { url: "/academics/achievements", changefreq: "monthly", priority: "0.7" },
  { url: "/admissions/annoucement", changefreq: "weekly", priority: "0.9" },
  { url: "/admissions/schedule", changefreq: "weekly", priority: "0.8" },
  { url: "/admissions/eligibility", changefreq: "monthly", priority: "0.8" },
  { url: "/admissions/procedure", changefreq: "monthly", priority: "0.8" },
  { url: "/admissions/vacancy", changefreq: "weekly", priority: "0.7" },
  { url: "/admissions/scholarship", changefreq: "monthly", priority: "0.7" },
  { url: "/admissions/fee-structure", changefreq: "monthly", priority: "0.8" },
  { url: "/admissions/faq", changefreq: "monthly", priority: "0.6" },
  { url: "/examinations/examinations-schedule", changefreq: "weekly", priority: "0.8" },
  { url: "/examinations/exam-notice", changefreq: "weekly", priority: "0.8" },
  { url: "/examinations/academics-notice", changefreq: "weekly", priority: "0.8" },
  { url: "/research/board-of-research", changefreq: "monthly", priority: "0.7" },
  { url: "/research/research-paper-publication", changefreq: "monthly", priority: "0.7" },
  { url: "/research/phd-admissions", changefreq: "monthly", priority: "0.8" },
  { url: "/research/Patent-publications", changefreq: "monthly", priority: "0.6" },
  { url: "/research/funded-projects", changefreq: "monthly", priority: "0.7" },
  { url: "/research/consultancy-training", changefreq: "monthly", priority: "0.7" },
  { url: "/alumni/alumni-report", changefreq: "monthly", priority: "0.7" },
  { url: "/alumni/alumni-testimonials", changefreq: "monthly", priority: "0.7" },
  { url: "/alumni/alumni-startup", changefreq: "monthly", priority: "0.7" },
  { url: "/placement/placement-cell", changefreq: "monthly", priority: "0.8" },
  { url: "/placement/recruiters", changefreq: "monthly", priority: "0.8" },
  { url: "/placement/placed-students", changefreq: "monthly", priority: "0.8" },
  { url: "/placement/placement-statistics", changefreq: "monthly", priority: "0.7" },
  { url: "/placement/skill-development", changefreq: "monthly", priority: "0.7" },
  { url: "/placement/internship-policy", changefreq: "monthly", priority: "0.6" },
  { url: "/campus-life/facilities", changefreq: "monthly", priority: "0.7" },
  { url: "/campus-life/events", changefreq: "weekly", priority: "0.8" },
  { url: "/campus-life/sports", changefreq: "monthly", priority: "0.6" },
  { url: "/contact", changefreq: "monthly", priority: "0.7" },
];

const toXmlEntry = ({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const generateSitemap = () => {
  const today = new Date().toISOString().slice(0, 10);

  // Build static entries
  const staticEntries = STATIC_URLS.map(({ url, changefreq, priority }) =>
    toXmlEntry({ loc: `${BASE_URL}${url}`, lastmod: today, changefreq, priority })
  );

  // Fetch dynamic content from DB
  const queries = [
    new Promise((resolve) =>
      db.query("SELECT id, date FROM events ORDER BY id DESC", (err, rows) =>
        resolve(err ? [] : rows)
      )
    ),
    new Promise((resolve) =>
      db.query("SELECT id, date FROM news ORDER BY id DESC LIMIT 50", (err, rows) =>
        resolve(err ? [] : rows)
      )
    ),
  ];

  Promise.all(queries).then(([events, news]) => {
    const dynamicEntries = [];

    // Events page gets updated whenever there are events
    if (events.length > 0) {
      const latestEventDate = events[0].date
        ? new Date(events[0].date).toISOString().slice(0, 10)
        : today;
      // Update the campus-life/events entry lastmod dynamically (already in static, skip duplicate)
      // Add individual event anchors if needed — here we just note the page is fresh
      dynamicEntries.push(
        toXmlEntry({
          loc: `${BASE_URL}/campus-life/events`,
          lastmod: latestEventDate,
          changefreq: "weekly",
          priority: "0.8",
        })
      );
    }

    // News pages
    if (news.length > 0) {
      const latestNewsDate = news[0].date
        ? new Date(news[0].date).toISOString().slice(0, 10)
        : today;
      dynamicEntries.push(
        toXmlEntry({
          loc: `${BASE_URL}/examinations/exam-notice`,
          lastmod: latestNewsDate,
          changefreq: "weekly",
          priority: "0.8",
        }),
        toXmlEntry({
          loc: `${BASE_URL}/examinations/academics-notice`,
          lastmod: latestNewsDate,
          changefreq: "weekly",
          priority: "0.8",
        }),
        toXmlEntry({
          loc: `${BASE_URL}/admissions/annoucement`,
          lastmod: latestNewsDate,
          changefreq: "weekly",
          priority: "0.9",
        })
      );
    }

    // Deduplicate: static entries take precedence; dynamic only adds if URL not already present
    const staticLocs = new Set(
      STATIC_URLS.map(({ url }) => `${BASE_URL}${url}`)
    );
    const uniqueDynamic = dynamicEntries.filter((entry) => {
      const locMatch = entry.match(/<loc>(.*?)<\/loc>/);
      return locMatch && !staticLocs.has(locMatch[1]);
    });

    // Remove static entries for URLs that have fresher dynamic versions
    const dynamicLocs = new Set(
      dynamicEntries.map((entry) => {
        const m = entry.match(/<loc>(.*?)<\/loc>/);
        return m ? m[1] : null;
      }).filter(Boolean)
    );
    const filteredStatic = staticEntries.filter((entry) => {
      const locMatch = entry.match(/<loc>(.*?)<\/loc>/);
      return locMatch && !dynamicLocs.has(locMatch[1]);
    });

    const allEntries = [...filteredStatic, ...dynamicEntries, ...uniqueDynamic];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${allEntries.join("\n\n")}

</urlset>`;

    const outputPath = path.join(__dirname, "public", "sitemap.xml");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, xml, "utf8");
    console.log(`✅ Sitemap generated: ${outputPath} (${allEntries.length} URLs)`);
    process.exit(0);
  }).catch((err) => {
    console.error("❌ Sitemap generation failed:", err);
    process.exit(1);
  });
};

generateSitemap();
