// Run against a running build: node scripts/check-seo.mjs http://127.0.0.1:3107
import assert from "node:assert/strict";

const origin = process.argv[2] || "http://127.0.0.1:3107";
const production = "https://propertysetu.co.in";
const sitemapResponse = await fetch(new URL("/sitemap.xml", origin));
assert.equal(sitemapResponse.status, 200, "Sitemap must be accessible");
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
  match[1].replaceAll("&amp;", "&"),
);
assert.ok(urls.length > 0, "Sitemap must contain public pages");
const titles = new Set();

for (const canonical of urls) {
  assert.ok(canonical.startsWith(`${production}/`), "Use the production canonical origin");
  const url = new URL(canonical);
  const path = url.pathname + url.search;
  const response = await fetch(new URL(path, origin));
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const pageTitles = [...html.matchAll(/<title[^>]*>(.*?)<\/title>/gs)];
  assert.equal(pageTitles.length, 1, `${path}: one title`);
  assert.ok(!titles.has(pageTitles[0][1]), `${path}: unique title`);
  titles.add(pageTitles[0][1]);
  const head = html.split("</head>")[0];
  const canonicalTags = [...head.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)];
  assert.equal(canonicalTags.length, 1, `${path}: one canonical`);
  assert.ok(
    canonicalTags[0][0].includes(`href="${canonical.replaceAll("&", "&amp;")}"`),
    `${path}: matching canonical`,
  );
  assert.match(head, /<meta\b[^>]*name="description"[^>]*content="[^"]+"/, `${path}: description`);
  assert.doesNotMatch(response.headers.get("x-robots-tag") || "", /noindex/, path);
  assert.doesNotMatch(head, /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/, path);
  const scripts = [
    ...head.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs),
  ];
  assert.ok(scripts.length > 0, `${path}: structured data`);
  for (const [, json] of scripts) JSON.parse(json);
  console.log(`PASS ${path}`);
}

for (const path of [
  "/admin",
  "/admin/users",
  "/admin-preview",
  "/explore?view=wallet",
  "/explore?view=details&id=seo-check",
  "/explore?view=home&city=Surat",
  "/missing-page-seo-check",
]) {
  const response = await fetch(new URL(path, origin));
  assert.equal(response.status, path.includes("missing-page") ? 404 : 200, path);
  assert.match(
    response.headers.get("x-robots-tag") || "",
    /noindex/,
    `${path}: excluded from indexing`,
  );
  await response.text();
  console.log(`PASS ${path} (noindex)`);
}
for (const path of ["/robots.txt", "/images/hero-villa.jpg", "/images/logo-emblem.png"]) {
  const response = await fetch(new URL(path, origin));
  assert.equal(response.status, 200, path);
  if (path === "/robots.txt")
    assert.ok((await response.text()).includes(`Sitemap: ${production}/sitemap.xml`));
  else await response.arrayBuffer();
}
console.log("SEO checks passed for sitemap pages, private pages, errors and social assets.");
