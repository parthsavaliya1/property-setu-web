import { productRequest, type SearchFilters } from "./explorer";

const storageKey = "propertysetu.recentSearches";
type RecentSearch = {
  name: string;
  q?: string;
  city?: string;
  listing_type?: string;
  category_slug?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
};

function signature(item: RecentSearch) {
  return JSON.stringify([
    item.q || "", item.city || "", item.listing_type || "", item.category_slug || "",
    item.min_price ?? "", item.max_price ?? "", item.bedrooms ?? "",
  ]).toLocaleLowerCase();
}

function readLocal(): RecentSearch[] {
  try {
    const items: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(items)
      ? items.filter((item): item is RecentSearch => !!item && typeof item.name === "string").slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

function writeLocal(items: RecentSearch[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 8)));
  } catch { /* Browsing still works when browser storage is unavailable. */ }
}

export async function rememberSearch(filters: SearchFilters, token?: string | null) {
  const q = filters.q?.trim().slice(0, 160) || "";
  const city = filters.city?.trim().slice(0, 120);
  const listing = filters.listing_type;
  const listingType = listing && ["sale", "rent", "lease", "pg"].includes(listing) ? listing : undefined;
  const category = filters.category?.trim().slice(0, 80);
  const number = (value?: string) => value?.trim() && Number.isFinite(Number(value)) && Number(value) >= 0
    ? Number(value) : undefined;
  const min = number(filters.min_price);
  const max = number(filters.max_price);
  const bedrooms = number(filters.bedrooms);
  if (q.length < 2 && !city && !listingType && !category && min === undefined && max === undefined && bedrooms === undefined) return;
  const item: RecentSearch = {
    name: [q, city, listingType, category, bedrooms !== undefined ? `${bedrooms} BHK` : ""]
      .filter(Boolean).join(" · ").slice(0, 80) || "Recent search",
    ...(q ? { q } : {}),
    ...(city ? { city } : {}),
    ...(listingType ? { listing_type: listingType } : {}),
    ...(category ? { category_slug: category } : {}),
    ...(min !== undefined ? { min_price: min } : {}),
    ...(max !== undefined ? { max_price: max } : {}),
    ...(bedrooms !== undefined ? { bedrooms } : {}),
  };
  if (token) {
    try {
      await productRequest("/saved-searches", token, "POST", item);
      return;
    } catch { /* Keep a local copy if the account save fails. */ }
  }
  writeLocal([item, ...readLocal().filter((saved) => signature(saved) !== signature(item))]);
}

export async function syncRecentSearches(token: string) {
  // Oldest first preserves recency when the API keeps the latest eight searches.
  for (const item of readLocal().reverse()) {
    try {
      await productRequest("/saved-searches", token, "POST", item);
      writeLocal(readLocal().filter((saved) => signature(saved) !== signature(item)));
    } catch { /* Retain unsuccessful saves for the next login. */ }
  }
}
