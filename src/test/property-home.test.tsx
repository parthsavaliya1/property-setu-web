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
});
beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue([]);
});

describe("Property browsing", () => {
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
