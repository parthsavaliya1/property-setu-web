import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/propertysetu";
import { rememberSearch, syncRecentSearches } from "@/lib/recent-searches";

vi.mock("@/lib/propertysetu", () => ({ api: vi.fn() }));
const request = vi.mocked(api);
const localSearches = () => JSON.parse(localStorage.getItem("propertysetu.recentSearches") || "[]");

beforeEach(() => {
  localStorage.clear();
  request.mockReset();
  request.mockResolvedValue({});
});

describe("automatic recent searches", () => {
  it("skips empty searches and keeps eight deduplicated guest searches, newest first", async () => {
    await rememberSearch({ q: " a " });
    expect(localSearches()).toEqual([]);
    for (let index = 0; index < 10; index++) await rememberSearch({ q: `City ${index}` });
    await rememberSearch({ q: " City 5 " });
    expect(localSearches()).toHaveLength(8);
    expect(localSearches()[0].q).toBe("City 5");
    expect(localSearches().filter((item: { q: string }) => item.q === "City 5")).toHaveLength(1);
    expect(request).not.toHaveBeenCalled();
  });

  it("saves submitted filters to the signed-in account with an automatic name", async () => {
    await rememberSearch({ q: " villa ", city: "Rajkot", category: "villa", listing_type: "sale", max_price: "5000000", bedrooms: "3" }, "customer-token");
    expect(request).toHaveBeenCalledWith("/api/saved-searches", {
      method: "POST",
      body: JSON.stringify({ name: "villa · Rajkot · sale · villa · 3 BHK", q: "villa", city: "Rajkot", listing_type: "sale", category_slug: "villa", max_price: 5000000, bedrooms: 3 }),
    }, "customer-token", 20000);
    expect(localSearches()).toEqual([]);
  });

  it("retains failed account saves locally and syncs them after login", async () => {
    request.mockRejectedValueOnce(new Error("Offline"));
    await rememberSearch({ q: "Ahmedabad" }, "customer-token");
    await rememberSearch({ q: "Rajkot" });
    expect(localSearches()).toHaveLength(2);
    request.mockClear();
    request.mockRejectedValueOnce(new Error("Still offline"));
    await syncRecentSearches("customer-token");
    expect(request).toHaveBeenCalledTimes(2);
    expect(localSearches().map((item: { q: string }) => item.q)).toEqual(["Ahmedabad"]);
    await syncRecentSearches("customer-token");
    expect(localSearches()).toEqual([]);
  });
});
