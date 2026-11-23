import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PropertyHome } from "@/components/propertysetu/property-home";
import { api } from "@/lib/propertysetu";
import { PropertySearches } from "@/components/propertysetu/property-searches";
import { ExplorerProvider } from "@/components/propertysetu/explorer/context";
import { parseExplorerSearch } from "@/lib/explorer";

vi.mock("@/lib/propertysetu", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/propertysetu")>()),
  api: vi.fn(),
}));
vi.mock("@/lib/ip-city", () => ({ detectIpCity: vi.fn().mockResolvedValue("Ahmedabad") }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    activeOptions: _options,
    ...props
  }: {
    to: string;
    children: ReactNode;
    activeOptions?: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
const request = vi.mocked(api);
let root: Root;
let container: HTMLDivElement;
async function mount() {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<PropertyHome />));
}
function button(name: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (element) => element.textContent === name || element.getAttribute("aria-label") === name,
  )!;
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  vi.restoreAllMocks();
});
beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue([]);
});

describe("Property browsing", () => {
  it("shows the app category controls on desktop and resets commercial filters when returning to Buy", async () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(
      <ExplorerProvider location={{ view: "home" }} navigate={() => {}}>
        <PropertyHome />
      </ExplorerProvider>,
    ));
    expect(container.querySelector(".home-categories")).toBeNull();
    expect(container.querySelector(".home-intent-tabs")).toBeTruthy();
    await act(async () => button("Commercial").click());
    await act(async () => button("Office").click());
    const latestQuery = () => new URL(String(request.mock.calls.filter(([path]) => String(path).startsWith("/api/properties?")).at(-1)?.[0]), "http://localhost").searchParams;
    expect(latestQuery().get("category")).toBe("office");
    expect(latestQuery().has("listing_type")).toBe(false);
    await act(async () => button("Buy").click());
    expect(latestQuery().get("listing_type")).toBe("sale");
    expect(latestQuery().has("category")).toBe(false);
    expect(button("All").getAttribute("aria-pressed")).toBe("true");
  });

  it("uses native mobile purpose and category filters and carries them into search", async () => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation(query => ({
      ...original(query), matches: query === "(max-width: 700px)",
    }));
    const navigate = vi.fn();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(
      <ExplorerProvider location={{ view: "home" }} navigate={navigate}>
        <PropertyHome />
      </ExplorerProvider>,
    ));
    const native = () => container.querySelector(".home-native-categories")!;
    const choose = async (label: string) => {
      const target = Array.from(native().querySelectorAll("button")).find(item => item.textContent === label)!;
      expect(target).toBeTruthy();
      await act(async () => target.click());
      expect(target.getAttribute("aria-pressed")).toBe("true");
    };
    const latestQuery = () => new URL(String(request.mock.calls.filter(([path]) => String(path).startsWith("/api/properties?")).at(-1)?.[0]), "http://localhost").searchParams;
    expect(latestQuery().get("listing_type")).toBe("sale");
    await choose("Rent");
    await choose("Apartment");
    expect(latestQuery().get("listing_type")).toBe("rent");
    expect(latestQuery().get("category")).toBe("apartment");
    await choose("Commercial");
    expect(latestQuery().has("listing_type")).toBe(false);
    expect(latestQuery().get("category")).toBe("commercial");
    await choose("Warehouse");
    expect(latestQuery().get("category")).toBe("warehouse");
    await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(navigate).toHaveBeenLastCalledWith(expect.objectContaining({ view: "search", category: "warehouse", listing_type: "" }));
    await choose("Buy");
    expect(latestQuery().get("listing_type")).toBe("sale");
    expect(latestQuery().has("category")).toBe(false);
    await act(async () => button("Property filters").click());
    const sheet = document.querySelector('[role="dialog"]')!;
    expect(sheet.textContent).toContain("Filters");
    const budget = sheet.querySelector<HTMLSelectElement>("#home-budget")!;
    await act(async () => {
      budget.value = "5000000";
      budget.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => Array.from(sheet.querySelectorAll("button")).find(item => item.textContent === "Apply filters")!.click());
    expect(navigate).toHaveBeenLastCalledWith(expect.objectContaining({ view: "search", listing_type: "sale", max_price: "5000000" }));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("immediately applies every homepage shortcut to the API and shows its active filters", async () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(<PropertySearches />));
    const shortcuts = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('a[href*="view=search"]'),
      (link) => new URL(link.href),
    );
    expect(shortcuts.length).toBe(37);
    for (const [index, url] of shortcuts.entries()) {
      request.mockClear();
      const location = parseExplorerSearch(Object.fromEntries(url.searchParams));
      await act(async () =>
        root.render(
          <ExplorerProvider location={location} navigate={() => {}} key={index}>
            <PropertyHome />
          </ExplorerProvider>,
        ),
      );
      const calls = request.mock.calls.filter(([path]) =>
        String(path).startsWith("/api/properties?"),
      );
      expect(calls.length).toBeGreaterThan(0);
      for (const [path] of calls) {
        const applied = new URL(String(path), "http://localhost").searchParams;
        for (const [key, value] of url.searchParams) {
          if (key !== "view") expect(applied.get(key), `${url.href}: ${key}`).toBe(value);
        }
        expect(applied.has("q")).toBe(false);
      }
      expect(
        container.querySelector('[aria-label="Applied property filters"]')?.children.length,
      ).toBeGreaterThan(0);
      expect(
        container
          .querySelector<HTMLButtonElement>('[aria-label="Property filters"]')
          ?.getAttribute("aria-expanded"),
      ).toBe("true");
      const maxPrice = url.searchParams.get("max_price");
      if (maxPrice)
        expect(container.querySelector<HTMLSelectElement>("#home-budget")?.value).toBe(maxPrice);
    }
    await act(async () => button("Clear filters").click());
    expect(request).toHaveBeenLastCalledWith("/api/properties?limit=50", {}, undefined);
    expect(container.querySelector('[aria-label="Applied property filters"]')).toBeNull();
  });

  it("combines search, category and budget on the existing API and clears them", async () => {
    await mount();
    await act(async () => {
      const input = container.querySelector("input")!;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        input,
        "Ahmedabad",
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () =>
      container
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    await act(async () => button("Rent").click());
    await act(async () => button("Property filters").click());
    await act(async () => {
      const select = container.querySelector("select")!;
      select.value = "5000000";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const path = String(request.mock.calls.at(-1)?.[0]);
    expect(path).toContain("q=Ahmedabad");
    expect(path).toContain("listing_type=rent");
    expect(path).toContain("max_price=5000000");
    await act(async () => button("Clear filters").click());
    expect(request).toHaveBeenLastCalledWith("/api/properties?limit=50", {}, undefined);
  });

  it("recovers from an API failure without showing invented listings", async () => {
    request.mockRejectedValueOnce(new Error("offline"));
    await mount();
    expect(container.textContent).toContain("We couldn’t load properties");
    await act(async () => button("Try again").click());
    expect(container.textContent).toContain("Your next place is on the horizon");
    expect(container.textContent).not.toContain("We couldn’t load properties");
  });

  it("separates live premium and standard records into their sections", async () => {
    request.mockResolvedValueOnce([
      {
        id: "premium",
        title: "Premium API home",
        price: 4000000,
        listing_type: "sale",
        is_premium: true,
      },
      { id: "standard", title: "Standard API home", price: 15000, listing_type: "rent" },
    ]);
    await mount();
    expect(container.textContent).toContain("Premium API home");
    expect(container.textContent).toContain("Standard API home");
    expect(container.querySelector(".home-premium-grid")?.textContent).toContain(
      "Premium API home",
    );
    expect(container.querySelector(".home-property-grid")?.textContent).toContain(
      "Standard API home",
    );
  });
});
