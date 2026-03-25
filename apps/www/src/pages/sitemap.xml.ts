import { readdirSync, statSync } from "node:fs";
import { posix, relative, resolve } from "node:path";
import { getCollection } from "astro:content";

export const prerender = true;

const site = "https://livedot.dev";
const pagesDir = resolve(process.cwd(), "src/pages");

type SitemapEntry = {
  pathname: string;
  source: string;
  changefreq: string;
  priority: string;
};

const exactMetadata = new Map([
  ["/", { changefreq: "daily", priority: "1.0" }],
  ["/pricing", { changefreq: "daily", priority: "0.9" }],
  ["/privacy", { changefreq: "daily", priority: "0.6" }],
  ["/terms", { changefreq: "daily", priority: "0.6" }],
  ["/help", { changefreq: "weekly", priority: "0.8" }],
]);

const prefixMetadata = [
  { prefix: "/blog/", changefreq: "weekly", priority: "0.8" },
  { prefix: "/help/", changefreq: "weekly", priority: "0.7" },
] as const;

const defaultMetadata = { changefreq: "monthly", priority: "0.7" };

const supportedPageExtensions = new Set([".astro", ".md", ".mdx"]);

const getPageFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      return getPageFiles(fullPath);
    }

    const extension = posix.extname(entry.name);
    if (!supportedPageExtensions.has(extension)) {
      return [];
    }

    if (entry.name.startsWith("[") || entry.name.includes("/[")) {
      return [];
    }

    return [fullPath];
  });

const toPathname = (source: string) => {
  const relativePath = relative(pagesDir, source).replaceAll("\\", "/");
  const withoutExtension = relativePath.replace(/\.(astro|md|mdx)$/, "");

  if (withoutExtension === "index") {
    return "/";
  }

  if (withoutExtension.endsWith("/index")) {
    return `/${withoutExtension.slice(0, -"/index".length)}`;
  }

  return `/${withoutExtension}`;
};

const getMetadata = (pathname: string) => {
  const exact = exactMetadata.get(pathname);
  if (exact) {
    return exact;
  }

  const prefixed = prefixMetadata.find((rule) => pathname.startsWith(rule.prefix));
  if (prefixed) {
    return prefixed;
  }

  return defaultMetadata;
};

const entries: SitemapEntry[] = getPageFiles(pagesDir)
  .filter((source) => !source.endsWith("/sitemap.xml.ts"))
  .map((source) => {
    const pathname = toPathname(source);
    const metadata = getMetadata(pathname);

    return {
      pathname,
      source: relative(process.cwd(), source).replaceAll("\\", "/"),
      changefreq: metadata.changefreq,
      priority: metadata.priority,
    };
  })
  .sort((a, b) => a.pathname.localeCompare(b.pathname));

const toLastMod = (source: string) => statSync(resolve(process.cwd(), source)).mtime.toISOString();

const toUrlEntry = (entry: SitemapEntry) => {
  const loc = `${site}${entry.pathname}`;
  const lastmod = toLastMod(entry.source);

  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    "  </url>",
  ].join("\n");
};

const docsSourcePath = (slug: string) => resolve(process.cwd(), "src/content/docs", `${slug}.md`);

export async function GET() {
  const docs = await getCollection("docs");
  const docsEntries: SitemapEntry[] = docs.map((doc) => {
    const pathname = `/help/${doc.id}`;
    const metadata = getMetadata(pathname);

    return {
      pathname,
      source: docsSourcePath(doc.id),
      changefreq: metadata.changefreq,
      priority: metadata.priority,
    };
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    [...entries, ...docsEntries].map(toUrlEntry).join("\n"),
    "</urlset>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
