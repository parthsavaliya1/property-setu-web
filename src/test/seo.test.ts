import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { metadata, PUBLIC_PATHS, shouldNoindex, SITE_URL } from "@/lib/seo";
import { explorerMetadata } from "@/lib/seo";
import { explorerViews, parseExplorerSearch } from "@/lib/explorer";

describe("Search indexing", () => {
  it("gives every explorer screen a distinct title and consistent indexing directives", () => {
    const titles = new Set();
    for (const view of explorerViews) {
      const head = explorerMetadata(parseExplorerSearch({ view }));
      titles.add(head.meta.find((tag) => "title" in tag)?.title);
      const noindex = shouldNoindex(new URL(`/explore?view=${view}`, SITE_URL), 200);
      expect(head.meta.find((tag) => tag.name === "robots")?.content).toBe(
        noindex ? "noindex, follow" : "index, follow, max-image-preview:large",
      );
      expect(head.links).toHaveLength(noindex ? 0 : 1);
    }
    expect(titles.size).toBe(explorerViews.length);
  });

  it.each([
    "q",
    "city",
    "min_price",
    "max_price",
    "bedrooms",
    "category",
    "listing_type",
    "id",
    "next",
  ])("keeps filtered or private explorer states out of the index (%s)", (key) => {
    const search = { view: "home", [key]: key === "next" ? "profile" : "1" };
    const head = explorerMetadata(parseExplorerSearch(search));
    expect(head.meta.find((tag) => tag.name === "robots")?.content).toBe("noindex, follow");
    expect(shouldNoindex(new URL(`/explore?${new URLSearchParams(search)}`, SITE_URL), 200)).toBe(
      true,
    );
  });

  it("uses the production domain consistently and emits parseable, escaped structured data", () => {
    const head = metadata(
      "Homes </script><script>alert(1)</script>",
      "Find homes in India.",
      "/listings",
    );
    expect(head.links).toEqual([{ rel: "canonical", href: `${SITE_URL}/listings` }]);
    expect(head.meta.find((tag) => tag.property === "og:url")?.content).toBe(
      `${SITE_URL}/listings`,
    );
    expect(head.meta.find((tag) => tag.property === "og:image")?.content).toMatch(
      /^https:\/\/propertysetu.co.in\//,
    );
    const json = head.scripts[0]!.children;
    expect(json).not.toContain("<");
    const data = JSON.parse(json);
    expect(
      data["@graph"].find((node: Record<string, unknown>) => node["@type"] === "WebPage").name,
    ).toContain("</script>");
    expect(
      data["@graph"].find((node: Record<string, unknown>) => node["@type"] === "BreadcrumbList")
        .itemListElement[1].item,
    ).toBe(`${SITE_URL}/listings`);
  });

  it("keeps the sitemap and robots declaration consistent with public canonical URLs", () => {
    const sitemap = readFileSync("public/sitemap.xml", "utf8");
    const urls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
    expect(urls).toEqual(PUBLIC_PATHS.map((path) => `${SITE_URL}${path}`));
    expect(readFileSync("public/robots.txt", "utf8")).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    for (const path of PUBLIC_PATHS)
      expect(shouldNoindex(new URL(path, SITE_URL), 200)).toBe(false);
  });

  it.each([
    "/admin",
    "/admin/",
    "/admin/users",
    "/admin-preview",
    "/explore?view=wallet",
    "/explore?view=chat&id=123",
    "/explore?view=details&id=123",
    "/explore?city=Surat",
    "/explore?view=home&next=profile",
  ])("excludes %s from indexing", (path) => {
    expect(shouldNoindex(new URL(path, SITE_URL), 200)).toBe(true);
  });

  it("excludes error responses without excluding the public explorer", () => {
    expect(shouldNoindex(new URL("/explore?view=home", SITE_URL), 200)).toBe(false);
    expect(shouldNoindex(new URL("/missing", SITE_URL), 404)).toBe(true);
    expect(shouldNoindex(new URL("/", SITE_URL), 500)).toBe(true);
    const privateHead = metadata("Wallet", "Account wallet.", "/explore", { noindex: true });
    expect(privateHead.meta.find((tag) => tag.name === "robots")?.content).toBe("noindex, follow");
    expect(privateHead.links).toEqual([]);
    expect(privateHead.scripts).toEqual([]);
  });
});
