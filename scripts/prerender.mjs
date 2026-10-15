import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPageSchema, getPageSeo, render, ROUTES } from "../.ssr/entry-server.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
const template = await readFile(join(dist, "index.html"), "utf8");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function documentFor(pathname) {
  const seo = getPageSeo(pathname);
  const schema = JSON.stringify(getPageSchema(pathname)).replaceAll("<", "\\u003c");
  const heroPreload =
    pathname === "/" ? '<link rel="preload" as="image" href="/hero-accueil.webp" fetchpriority="high"/>' : "";
  const head = `
    ${heroPreload}
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}"/>
    <meta name="robots" content="${seo.robots}"/>
    <meta name="geo.region" content="${seo.geoRegion}"/>
    <meta name="geo.placename" content="${escapeHtml(seo.geoPlace)}"/>
    <link rel="canonical" href="${seo.canonical}"/>
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png"/>
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png"/>
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
    <link rel="manifest" href="/site.webmanifest"/>
    <meta property="og:type" content="website"/>
    <meta property="og:site_name" content="TransExpress78"/>
    <meta property="og:locale" content="fr_FR"/>
    <meta property="og:title" content="${escapeHtml(seo.title)}"/>
    <meta property="og:description" content="${escapeHtml(seo.description)}"/>
    <meta property="og:url" content="${seo.canonical}"/>
    <meta property="og:image" content="${seo.image}"/>
    <meta property="og:image:secure_url" content="${seo.image}"/>
    <meta property="og:image:type" content="image/png"/>
    <meta property="og:image:width" content="1200"/>
    <meta property="og:image:height" content="630"/>
    <meta property="og:image:alt" content="TransExpress78, transport de marchandises"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="${escapeHtml(seo.title)}"/>
    <meta name="twitter:description" content="${escapeHtml(seo.description)}"/>
    <meta name="twitter:image" content="${seo.image}"/>
    <meta name="twitter:image:alt" content="TransExpress78 – Livraison express France et Europe"/>
    <script id="schema-page" type="application/ld+json">${schema}</script>`;
  const clean = template
    .replace(/<title>.*?<\/title>/gis, "")
    .replace(/<meta\s+(?:name|property)=["'](?:description|robots|geo\.[^"']+|ICBM|og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<link\s+[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon|manifest)["'][^>]*>\s*/gi, "")
    .replace(/<script\s+id=["']schema-page["'][^>]*>.*?<\/script>\s*/gis, "");
  return clean
    .replace("</head>", `${head}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root">${render(pathname)}</div>`);
}

async function emit(pathname, destination) {
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, documentFor(pathname));
}

for (const pathname of ROUTES) {
  const destination =
    pathname === "/" ? join(dist, "index.html") : join(dist, pathname.slice(1), "index.html");
  await emit(pathname, destination);
}

await emit("/404.html", join(dist, "404.html"));

const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map(
  (pathname) => `  <url>
    <loc>https://transexpress78.fr${pathname}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
).join("\n")}
</urlset>
`;
await writeFile(join(dist, "sitemap.xml"), sitemap);
await rm(join(root, ".ssr"), { recursive: true, force: true });

export function prerenderedRoutes() {
  return ROUTES;
}
