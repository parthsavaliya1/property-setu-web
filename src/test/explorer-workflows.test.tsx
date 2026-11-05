import { reverseGeocode } from "@/lib/reverse-geocode";
import { detectIpCity } from "@/lib/ip-city";
import { ExplorerLanguageProvider } from "@/components/propertysetu/explorer/language";
import { AboutPage } from "@/components/propertysetu/explorer/about";
import { AnimatedLoader } from "@/components/ui/animated-loader";
import { listingPayment } from "@/lib/listing-payment";
import { AppChrome } from "@/components/propertysetu/explorer/ui";
import { ExplorerApp } from "@/components/propertysetu/explorer/app";
import { SiteHeader, OpenApp } from "@/components/propertysetu/site";
import { Journey, WaysToLive } from "@/components/propertysetu/discover";
import { usePagedResource } from "@/components/propertysetu/explorer/paging";
import { DetailsPage } from "@/components/propertysetu/explorer/details";
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/propertysetu";
import { parseExplorerSearch, planCharge, type ExplorerLocation } from "@/lib/explorer";
import { ExplorerProvider } from "@/components/propertysetu/explorer/context";
import { RequireAccount } from "@/components/propertysetu/explorer/ui";
import { LoginPage } from "@/components/propertysetu/explorer/auth";
import {
  WalletPage,
  InquiriesPage,
  MyPropertiesPage,
  NotificationsPage,
  VisitsPage,
  ProfilePage,
} from "@/components/propertysetu/explorer/account";
import { CreatePropertyPage } from "@/components/propertysetu/explorer/create";

vi.mock("@/lib/reverse-geocode", () => ({ reverseGeocode: vi.fn() }));
vi.mock("@/lib/ip-city", () => ({ detectIpCity: vi.fn(async () => "") }));
vi.mock("@/lib/propertysetu", async (original) => ({
  ...(await original<typeof import("@/lib/propertysetu")>()),
  api: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
const request = vi.mocked(api);
const navigate = vi.fn();
const user = { id: "user-one", phone: "9876543210" };
const session = { token: "browser-user-token", user };
let root: Root;
let container: HTMLDivElement;
function response(path: string, options?: RequestInit) {
  if (path === "/api/me")
    return {
      profile: { id: user.id, full_name: "Test owner", phone: user.phone },
      roles: ["owner"],
      is_admin: false,
      is_super_admin: false,
    };
  if (path === "/api/wallet") return { balance: 0 };
  if (path === "/api/wallet/transactions") return [];
  if (path === "/api/categories") return [{ id: "category-one", slug: "house", name: "House" }];
  if (path === "/api/amenities") return [];
  if (path === "/api/listing-settings")
    return { standardPrice: 100, premiumPrice: 200, yearlyDiscountPercent: 20 };
  if (path === "/api/me/free-listing") return { available: false };
  return [];
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  navigate.mockReset();
  vi.mocked(detectIpCity).mockResolvedValue("");
  vi.mocked(reverseGeocode).mockReset();
  request.mockReset();
  request.mockImplementation(async (path, options) => response(path, options));
});
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  delete window.Razorpay;
});
async function mount(children: ReactNode, location: ExplorerLocation, signedIn = true) {
  if (signedIn) localStorage.setItem("propertysetu_web_session", JSON.stringify(session));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root.render(
      <ExplorerProvider location={location} navigate={navigate}>
        {children}
      </ExplorerProvider>,
    ),
  );
}
function button(text: string) {
  const found = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (item) => item.textContent?.trim() === text,
  );
  if (!found) throw new Error(`Missing button: ${text}`);
  return found;
}
async function click(text: string) {
  await act(async () => button(text).click());
}
async function fill(selector: string, value: string) {
  const element = document.querySelector<HTMLInputElement>(selector)!;
  expect(element).toBeTruthy();
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function submit() {
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

describe("Explorer account workflows", () => {
  it("gates wallet access and preserves the destination after sign-in", async () => {
    await mount(
      <RequireAccount>
        <WalletPage />
      </RequireAccount>,
      { view: "wallet" },
      false,
    );
    expect(request.mock.calls.some(([path]) => path === "/api/wallet")).toBe(false);
    await click("Sign in or create account");
    expect(navigate).toHaveBeenLastCalledWith({ view: "login", next: "wallet" });
  });
  it("verifies the server-issued OTP session, isolates user authentication, and resumes the destination", async () => {
    localStorage.setItem("propertysetu_admin_token", "admin-session-untouched");
    request.mockImplementation(async (path, options) => {
      if (path === "/api/auth/send-otp")
        return { sessionId: "server-otp-session", message: "Code sent" };
      if (path === "/api/auth/verify-otp") return session;
      return response(path, options);
    });
    await mount(<LoginPage />, { view: "login", next: "wallet" }, false);
    await fill("input[type=tel]", "9876543210");
    await submit();
    await fill('input[autocomplete="one-time-code"]', "123456");
    await submit();
    const call = request.mock.calls.find(([path]) => path === "/api/auth/verify-otp");
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({
      phone: "9876543210",
      otp: "123456",
      sessionId: "server-otp-session",
      create: false,
    });
    expect(JSON.parse(localStorage.getItem("propertysetu_web_session")!)).toEqual(session);
    expect(localStorage.getItem("propertysetu_admin_token")).toBe("admin-session-untouched");
    expect(navigate).toHaveBeenLastCalledWith({ view: "wallet" });
  });
  it("clears an expired user session without changing the admin session", async () => {
    localStorage.setItem("propertysetu_admin_token", "admin-token");
    request.mockRejectedValue(new ApiError("Expired token", 401));
    await mount(
      <RequireAccount>
        <WalletPage />
      </RequireAccount>,
      { view: "wallet" },
    );
    expect(localStorage.getItem("propertysetu_web_session")).toBeNull();
    expect(localStorage.getItem("propertysetu_admin_token")).toBe("admin-token");
    expect(container.textContent).toContain("Sign in or create account");
  });
  it("keeps paid-but-unverified top-ups retryable and never creates a second payment order", async () => {
    let verified = false;
    let verificationAttempts = 0;
    window.Razorpay = class {
      constructor(private options: Record<string, unknown>) {}
      on() {}
      open() {
        (this.options["handler"] as (value: unknown) => void)({
          razorpay_order_id: "order-one",
          razorpay_payment_id: "payment-one",
          razorpay_signature: "test-signature",
        });
      }
    };
    request.mockImplementation(async (path, options) => {
      if (path === "/api/wallet") return { balance: verified ? 500 : 0 };
      if (path === "/api/wallet/order")
        return {
          key_id: "test-key",
          order_id: "order-one",
          amount: 50000,
          currency: "INR",
          description: "Wallet top-up",
        };
      if (path === "/api/wallet/verify") {
        verificationAttempts++;
        if (verificationAttempts === 1) throw new Error("Verification temporarily unavailable");
        verified = true;
        return { ok: true, balance: 500 };
      }
      return response(path, options);
    });
    await mount(<WalletPage />, { view: "wallet" });
    expect(container.textContent).toContain("₹0");
    await submit();
    expect(verified).toBe(false);
    expect(button("Retry payment verification")).toBeTruthy();
    expect(sessionStorage.getItem(`propertysetu_pending_payment:${user.id}`)).toContain(
      "payment-one",
    );
    await submit();
    expect(request.mock.calls.filter(([path]) => path === "/api/wallet/order")).toHaveLength(1);
    expect(verified).toBe(true);
    expect(sessionStorage.getItem(`propertysetu_pending_payment:${user.id}`)).toBeNull();
    expect(container.textContent).toContain("₹500");
  });
  it("reuses a saved draft after publishing fails instead of creating a duplicate listing", async () => {
    let spends = 0;
    request.mockImplementation(async (path, options) => {
      if (path === "/api/wallet") return { balance: 1000 };
      if (path === "/api/uploads") {
        const form = options?.body as FormData;
        return { file: { url: `https://images.example/${(form.get("file") as File).name}` } };
      }
      if (path === "/api/properties" && options?.method === "POST")
        return {
          id: "created-property",
          owner_id: user.id,
          status: "draft",
          is_premium: false,
          listing_term: null,
          expires_at: null,
        };
      if (path === "/api/properties/created-property" && options?.method === "GET")
        return {
          id: "created-property",
          status: "draft",
          is_premium: false,
          listing_term: null,
          expires_at: null,
          owner_id: user.id,
        };
      if (path === "/api/properties/created-property" && options?.method === "PATCH")
        return {
          id: "created-property",
          owner_id: user.id,
          status: "draft",
          is_premium: false,
          listing_term: null,
          expires_at: null,
        };
      if (path === "/api/wallet/spend") {
        spends++;
        if (spends === 1) throw new Error("Publish temporarily unavailable");
        return { ok: true, balance: 900, charged: 100 };
      }
      return response(path, options);
    });
    await mount(<CreatePropertyPage />, { view: "create" });
    await click("Continue");
    await fill("input[name=title]", "A family home");
    await fill("input[name=price]", "5000000");
    await click("Continue");
    await fill("input[name=address]", "12 Garden Road");
    await fill("input[name=city]", "Rajkot");
    await click("Continue");
    const fileInput = container.querySelector<HTMLInputElement>("input[type=file][multiple]")!;
    await act(async () => {
      Object.defineProperty(fileInput, "files", {
        value: [
          new File(["photo-one"], "one.jpg", { type: "image/jpeg" }),
          new File(["photo-two"], "two.jpg", { type: "image/jpeg" }),
        ],
        configurable: true,
      });
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await click("Continue");
    await submit();
    expect(container.textContent).toContain("Publish temporarily unavailable");
    await submit();
    expect(
      request.mock.calls.filter(
        ([path, options]) => path === "/api/properties" && options?.method === "POST",
      ),
    ).toHaveLength(1);
    expect(
      request.mock.calls.some(
        ([path, options]) =>
          path === "/api/properties/created-property" && options?.method === "PATCH",
      ),
    ).toBe(true);
    const creation = request.mock.calls.find(
      ([path, options]) => path === "/api/properties" && options?.method === "POST",
    );
    const payload = JSON.parse(String(creation?.[1]?.body));
    expect(payload.status).toBe("draft");
    expect(payload.images).toHaveLength(2);
    expect(payload.images[0].is_cover).toBe(true);
    expect(payload.location.city).toBe("Rajkot");
    expect(navigate).toHaveBeenLastCalledWith({ view: "my-properties" });
  });
});

describe("Explorer listing plans and routing", () => {
  const settings = { standardPrice: 100, premiumPrice: 200, yearlyDiscountPercent: 20 };
  it("charges the server-configured yearly rate and the difference for active upgrades", () => {
    expect(planCharge(settings, "premium", "year")).toBe(1920);
    expect(
      planCharge(settings, "premium", "month", {
        status: "published",
        is_premium: false,
        listing_term: "month",
        expires_at: "2099-01-01",
      }),
    ).toBe(100);
    expect(
      planCharge(settings, "premium", "month", {
        status: "expired",
        is_premium: true,
        listing_term: "year",
        expires_at: "2000-01-01",
      }),
    ).toBe(200);
    expect(
      planCharge(settings, "premium", "month", {
        status: "published",
        is_premium: false,
        listing_term: "trial",
        expires_at: "2099-01-01",
      }),
    ).toBe(200);
  });
  it("accepts only known product views and bounded string parameters", () => {
    expect(
      parseExplorerSearch({ view: "admin", id: "x".repeat(201), q: { unsafe: true } }),
    ).toEqual({ view: "home" });
    expect(parseExplorerSearch({ view: "search", city: "Rajkot", max_price: "5000000" })).toEqual({
      view: "search",
      city: "Rajkot",
      max_price: "5000000",
    });
  });
});

describe("Explorer connections and complete lists", () => {
  it("opens the buyer conversation from an owner inquiry", async () => {
    request.mockImplementation(async (path, options) => {
      if (path === "/api/inquiries")
        return [
          {
            id: "inquiry-one",
            property_id: "property-one",
            buyer_id: "buyer-one",
            status: "new",
            message: "Is this available?",
            created_at: "2026-11-05",
            property_title: "Garden home",
          },
        ];
      if (path === "/api/properties/property-one/chat") return { id: "thread-one" };
      return response(path, options);
    });
    await mount(<InquiriesPage />, { view: "inquiries" });
    await click("Reply in chat");
    const call = request.mock.calls.find(([path]) => path === "/api/properties/property-one/chat");
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ buyer_id: "buyer-one" });
    expect(navigate).toHaveBeenLastCalledWith({ view: "chat", id: "thread-one" });
  });
  it("shows availability instead of contact actions on a sold property", async () => {
    request.mockImplementation(async (path, options) => {
      if (path === "/api/properties/sold-property")
        return {
          id: "sold-property",
          title: "A sold home",
          status: "sold",
          owner_id: "other-owner",
          listing_type: "sale",
          price: 5000000,
          images: [],
        };
      return response(path, options);
    });
    await mount(<DetailsPage id="sold-property" />, { view: "details", id: "sold-property" });
    expect(container.textContent).toContain("This property is no longer available.");
    expect(
      Array.from(container.querySelectorAll("button")).some(
        (item) => item.textContent === "Send inquiry",
      ),
    ).toBe(false);
  });
  it("shows a recoverable unavailable state for a missing property and retries the link", async () => {
    let missing = true;
    request.mockImplementation(async (path, options) => {
      if (path === "/api/properties/trst") {
        if (missing) throw new ApiError("Property not found", 404);
        return {
          id: "property-one",
          title: "Available home",
          status: "published",
          owner_id: "other-owner",
          listing_type: "sale",
          images: [],
        };
      }
      return response(path, options);
    });
    await mount(<DetailsPage id="trst" />, { view: "details", id: "trst" }, false);
    expect(container.textContent).toContain("Property unavailable");
    expect(container.textContent).not.toContain("Unable to load this page");
    expect(container.querySelector('a[href="/explore?view=home"]')?.textContent).toBe(
      "Browse properties",
    );
    missing = false;
    await click("Try again");
    expect(container.textContent).toContain("Available home");
    expect(container.textContent).not.toContain("Property unavailable");
  });
  it("loads further property pages without duplicating overlapping records", async () => {
    const first = Array.from({ length: 50 }, (_, index) => ({ id: String(index) }));
    request.mockImplementation(async (path, options) => {
      if (path === "/api/properties?limit=50") return first;
      if (path === "/api/properties?limit=50&offset=50") return [{ id: "49" }, { id: "50" }];
      return response(path, options);
    });
    function Pager() {
      const list = usePagedResource<{ id: string }>("/properties");
      return (
        <>
          <span data-count>{list.data?.length || 0}</span>
          {list.hasMore && <button onClick={() => void list.loadMore()}>Load more</button>}
        </>
      );
    }
    await mount(<Pager />, { view: "home" }, false);
    expect(container.querySelector("[data-count]")?.textContent).toBe("50");
    await click("Load more");
    expect(container.querySelector("[data-count]")?.textContent).toBe("51");
    expect(request.mock.calls.some(([path]) => path.includes("offset=50"))).toBe(true);
  });
});

describe("Website-only entry points", () => {
  it("opens the create-property form directly from Post property for a guest", async () => {
    function Harness() {
      const [location, setLocation] = useState<ExplorerLocation>({ view: "home" });
      return (
        <ExplorerApp
          location={location}
          navigate={(next) => {
            navigate(next);
            setLocation(next);
          }}
        />
      );
    }
    await mount(<Harness />, { view: "home" }, false);
    const link = container.querySelector<HTMLAnchorElement>('a[href="/explore?view=create"]')!;
    expect(link).toBeTruthy();
    await act(async () => link.click());
    expect(navigate).toHaveBeenLastCalledWith({ view: "create" });
    expect(container.textContent).toContain("Give your property a new beginning");
    expect(container.querySelector("select")).toBeTruthy();
    expect(container.textContent).not.toContain("Your next move starts here");
    expect(
      request.mock.calls.some(
        ([path]) => path === "/api/wallet" || path === "/api/me/free-listing",
      ),
    ).toBe(false);
  });
  it("signs in inside the listing form and retains the entered property details", async () => {
    request.mockImplementation(async (path, options) => {
      if (path === "/api/auth/send-otp")
        return { sessionId: "inline-otp-session", message: "Code sent" };
      if (path === "/api/auth/verify-otp") return session;
      return response(path, options);
    });
    await mount(<CreatePropertyPage />, { view: "create" }, false);
    await click("Continue");
    await fill("input[name=title]", "My unfinished web listing");
    await click("Save draft");
    expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    await fill("input[type=tel]", "+919876543210");
    await act(async () => {
      document
        .querySelector('[role="dialog"] form')!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await fill('input[autocomplete="one-time-code"]', "123456");
    await act(async () => {
      document
        .querySelector('[role="dialog"] form')!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector<HTMLInputElement>("input[name=title]")?.value).toBe(
      "My unfinished web listing",
    );
    expect(navigate).not.toHaveBeenCalled();
    expect(
      request.mock.calls.some(
        ([path, options]) => path === "/api/properties" && options?.method === "POST",
      ),
    ).toBe(false);
    const sent = request.mock.calls.find(([path]) => path === "/api/auth/send-otp");
    expect(JSON.parse(String(sent?.[1]?.body)).phone).toBe("9876543210");
  });
  it("shows the desktop wallet and owned properties without repeating the account dropdown", async () => {
    request.mockImplementation(async (path, options) => {
      if (path === "/api/wallet") return { balance: 1250 };
      if (path.startsWith("/api/properties?mine=true"))
        return [listingRecord({ title: "My desktop listing" })];
      return response(path, options);
    });
    await mount(<ProfilePage />, { view: "profile" });
    expect(container.querySelector(".xp-profile-menu")).toBeNull();
    expect(container.textContent).not.toContain("Your account");
    expect(container.querySelector(".xp-profile-wallet")?.textContent).toContain("1,250");
    expect(
      container.querySelector('.xp-profile-wallet a[href="/explore?view=wallet"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('.xp-profile-wallet a[href="/explore?view=history"]'),
    ).toBeTruthy();
    expect(container.querySelector(".xp-profile-properties")?.textContent).toContain(
      "My desktop listing",
    );
    expect(container.textContent).not.toContain("Appearance");
    expect(container.querySelector(".xp-account-danger")).toBeNull();
    expect(request.mock.calls.some(([, options]) => options?.method === "DELETE")).toBe(false);
  });

  it("keeps marketing app and owner actions on this website", async () => {
    await mount(
      <>
        <SiteHeader />
        <OpenApp />
        <Journey />
        <WaysToLive />
      </>,
      { view: "home" },
      false,
    );
    expect(
      Array.from(container.querySelectorAll("a")).some((link) =>
        link.href.includes("app.propertysetu.com"),
      ),
    ).toBe(false);
    await act(async () => container.querySelector<HTMLButtonElement>("#owner-tab")!.click());
    expect(container.querySelector('a[href="/explore?view=create"]')).toBeTruthy();
    expect(
      Array.from(container.querySelectorAll("a"))
        .filter((link) => link.getAttribute("href")?.startsWith("/explore"))
        .every((link) => !link.getAttribute("target")),
    ).toBe(true);
  });
});

describe("VADI-style account navigation", () => {
  async function openAccountMenu() {
    const trigger = container.querySelector<HTMLButtonElement>('button[aria-label="My account"]')!;
    expect(trigger).toBeTruthy();
    await act(async () => {
      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    return trigger;
  }
  it("replaces the sidebar with a grouped header menu containing every product destination", async () => {
    await mount(
      <AppChrome>
        <p>Account screen</p>
      </AppChrome>,
      { view: "profile" },
    );
    expect(container.querySelector(".xp-sidebar")).toBeNull();
    expect(document.querySelector('[role="menu"]')).toBeNull();
    await openAccountMenu();
    const menu = document.querySelector('[role="menu"][aria-label="Account options"]')!;
    expect(menu).toBeTruthy();
    const links = Array.from(menu.querySelectorAll<HTMLAnchorElement>('a[role="menuitem"]'));
    for (const view of [
      "home",
      "search",
      "map",
      "create",
      "saved",
      "my-properties",
      "wallet",
      "history",
      "chats",
      "inquiries",
      "visits",
      "notifications",
      "saved-searches",
      "profile",
      "blocked",
    ]) {
      expect(links.some((link) => link.getAttribute("href") === `/explore?view=${view}`)).toBe(
        true,
      );
    }
    expect(menu.textContent).toContain("My account");
    expect(menu.textContent).toContain("Explore & more");
    expect(menu.textContent).toContain("Sign out");
    expect(menu.querySelector('a[href="/privacy"]')).toBeTruthy();
    expect(menu.querySelector('a[href="/terms"]')).toBeTruthy();
  });
  it("navigates from the dropdown and closes it, and supports Escape", async () => {
    await mount(
      <AppChrome>
        <p>Account screen</p>
      </AppChrome>,
      { view: "profile" },
    );
    await openAccountMenu();
    await act(async () => {
      document
        .querySelector<HTMLAnchorElement>('[role="menuitem"][href="/explore?view=wallet"]')!
        .click();
    });
    expect(navigate).toHaveBeenLastCalledWith({ view: "wallet" });
    expect(document.querySelector('[role="menu"]')).toBeNull();
    await openAccountMenu();
    await act(async () => {
      document
        .querySelector('[role="menu"]')!
        .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });
  it("confirms sign out from the menu and keeps the administrator session untouched", async () => {
    localStorage.setItem("propertysetu_admin_token", "admin-token");
    await mount(
      <AppChrome>
        <p>Account screen</p>
      </AppChrome>,
      { view: "profile" },
    );
    await openAccountMenu();
    await act(async () => {
      Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'))
        .find((item) => item.textContent === "Sign out")!
        .click();
    });
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog).toBeTruthy();
    await act(async () => {
      Array.from(dialog.querySelectorAll("button"))
        .find((item) => item.textContent === "Sign out")!
        .click();
    });
    expect(localStorage.getItem("propertysetu_web_session")).toBeNull();
    expect(localStorage.getItem("propertysetu_admin_token")).toBe("admin-token");
    expect(navigate).toHaveBeenLastCalledWith({ view: "home" });
  });
});

describe("App loading behaviour", () => {
  it("uses the branded logo loader for page and inline loading states", async () => {
    await mount(
      <>
        <AnimatedLoader fullScreen />
        <AnimatedLoader size="small" label="Saving listing" />
      </>,
      { view: "home" },
      false,
    );
    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(2);
    expect(container.querySelector(".property-loader-page img")?.getAttribute("src")).toBe(
      "/images/logo-emblem.png",
    );
    expect(container.querySelector('[aria-label="Saving listing"]')).toBeTruthy();
  });
  it("shows one My properties loader and does not wait for the statistics request", async () => {
    let resolveList!: (rows: unknown) => void;
    let rejectStats!: (error: Error) => void;
    const listPromise = new Promise((resolve) => {
      resolveList = resolve;
    });
    const statsPromise = new Promise((_, reject) => {
      rejectStats = reject;
    });
    request.mockImplementation(async (path, options) => {
      if (path === "/api/properties?mine=true&limit=50") return listPromise;
      if (path === "/api/me/property-stats") return statsPromise;
      return response(path, options);
    });
    await mount(<MyPropertiesPage />, { view: "my-properties" });
    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(1);
    await act(async () =>
      resolveList([
        {
          id: "my-property",
          title: "My garden house",
          price: 1000000,
          listing_type: "sale",
          status: "published",
          expires_at: "2099-01-01",
        },
      ]),
    );
    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0);
    expect(container.textContent).toContain("My garden house");
    await act(async () => rejectStats(new Error("Statistics unavailable")));
    expect(container.textContent).toContain("My garden house");
    expect(container.textContent).toContain("Retry statistics");
    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0);
  });
});

describe("App monthly listing rules", () => {
  const settings = { standardPrice: 100, premiumPrice: 200, yearlyDiscountPercent: 20 };
  const monthly = {
    status: "published",
    expires_at: "2099-01-01",
    is_premium: false,
    listing_term: "month",
  };
  it("applies the free trial only to a non-live regular monthly listing", () => {
    expect(listingPayment(settings, "standard", "month", null, true)).toMatchObject({
      useFree: true,
      due: 0,
    });
    expect(listingPayment(settings, "premium", "month", null, true)).toMatchObject({
      useFree: false,
      due: 200,
    });
    expect(listingPayment(settings, "standard", "year", null, true)).toMatchObject({
      useFree: false,
      due: 960,
    });
    expect(listingPayment(settings, "standard", "month", monthly, true)).toMatchObject({
      useFree: false,
      due: 0,
    });
  });
  it("keeps active trial edits free and charges the monthly fee only after expiry", () => {
    expect(
      listingPayment(settings, "standard", "month", { ...monthly, listing_term: "trial" }, false),
    ).toMatchObject({ due: 0, useFree: false, live: true });
    expect(
      listingPayment(
        settings,
        "standard",
        "month",
        { ...monthly, status: "expired", expires_at: "2000-01-01", listing_term: "trial" },
        false,
      ),
    ).toMatchObject({ due: 100, useFree: false, live: false });
    expect(
      listingPayment(
        settings,
        "standard",
        "month",
        { ...monthly, status: "expired", expires_at: "2000-01-01" },
        false,
      ),
    ).toMatchObject({ due: 100, term: "month" });
  });
  it("retains an existing listing plan on edit just as the app does", () => {
    const current = { ...monthly, is_premium: true, listing_term: "year" };
    expect(listingPayment(settings, "standard", "month", current, false, true)).toMatchObject({
      badge: "premium",
      term: "year",
      due: 0,
    });
    expect(
      listingPayment(
        settings,
        "standard",
        "month",
        { ...current, status: "expired", expires_at: "2000-01-01" },
        false,
        true,
      ),
    ).toMatchObject({ badge: "premium", term: "year", due: 1920 });
  });
});

function listingRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "listing-one",
    owner_id: user.id,
    title: "My garden home",
    description: "A quiet family home",
    category_slug: "house",
    listing_type: "sale",
    price: "5000000",
    address: "12 Garden Road",
    city: "Rajkot",
    status: "published",
    expires_at: "2099-01-01",
    is_premium: false,
    listing_term: "month",
    images: [
      {
        id: "photo1",
        image_url: "https://images.example/one.jpg",
        image_type: "gallery",
        is_cover: true,
      },
      {
        id: "photo2",
        image_url: "https://images.example/two.jpg",
        image_type: "gallery",
        is_cover: false,
      },
    ],
    ...overrides,
  };
}
async function reviewExistingListing() {
  for (let index = 0; index < 4; index++) await click("Continue");
}
async function prepareNewListing() {
  await mount(<CreatePropertyPage />, { view: "create" });
  await click("Continue");
  await fill("input[name=title]", "My new home");
  await click("Continue");
  await fill("input[name=address]", "12 Garden Road");
  await fill("input[name=city]", "Rajkot");
  await click("Continue");
  const fileInput = container.querySelector<HTMLInputElement>("input[type=file][multiple]")!;
  await act(async () => {
    Object.defineProperty(fileInput, "files", {
      value: [
        new File(["one"], "one.jpg", { type: "image/jpeg" }),
        new File(["two"], "two.jpg", { type: "image/jpeg" }),
      ],
      configurable: true,
    });
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await click("Continue");
}
describe("Publishing parity with the app", () => {
  it.each(["month", "trial"])(
    "edits an active %s listing without charging or changing its expiry",
    async (listingTerm) => {
      const listing = listingRecord({ listing_term: listingTerm });
      request.mockImplementation(async (path, options) => {
        if (path === "/api/properties/listing-one") return listing;
        return response(path, options);
      });
      await mount(<CreatePropertyPage id="listing-one" />, { view: "create", id: "listing-one" });
      await reviewExistingListing();
      expect(button("Save changes")).toBeTruthy();
      await submit();
      expect(
        request.mock.calls.some(
          ([path]) =>
            path === "/api/wallet/spend" ||
            path === "/api/wallet/order" ||
            path.endsWith("/publish-free"),
        ),
      ).toBe(false);
      const update = request.mock.calls.find(
        ([path, options]) => path === "/api/properties/listing-one" && options?.method === "PATCH",
      );
      expect(JSON.parse(String(update?.[1]?.body))).toMatchObject({ status: "published" });
      expect(JSON.parse(String(update?.[1]?.body))).not.toHaveProperty("expires_at");
      expect(navigate).toHaveBeenLastCalledWith({ view: "my-properties" });
    },
  );
  it("renews an expired monthly listing through the same wallet endpoint and monthly term", async () => {
    const expired = listingRecord({ status: "expired", expires_at: "2000-01-01" });
    request.mockImplementation(async (path, options) => {
      if (path === "/api/properties/listing-one")
        return options?.method === "PATCH" ? { ...expired, status: "draft" } : expired;
      if (path === "/api/wallet") return { balance: 1000 };
      if (path === "/api/wallet/spend") return { ok: true, charged: 100, balance: 900 };
      return response(path, options);
    });
    await mount(<CreatePropertyPage id="listing-one" />, { view: "create", id: "listing-one" });
    await reviewExistingListing();
    await submit();
    const spend = request.mock.calls.find(([path]) => path === "/api/wallet/spend");
    expect(JSON.parse(String(spend?.[1]?.body))).toEqual({
      property_id: "listing-one",
      listing_badge: "standard",
      term: "month",
    });
    expect(request.mock.calls.some(([path]) => path === "/api/wallet/order")).toBe(false);
  });
  it("uses the available free trial automatically for a first regular monthly listing", async () => {
    request.mockImplementation(async (path, options) => {
      if (path === "/api/me/free-listing") return { available: true };
      if (path === "/api/uploads")
        return {
          file: {
            url: `https://images.example/${((options?.body as FormData).get("file") as File).name}`,
          },
        };
      if (path === "/api/properties")
        return listingRecord({ status: "draft", expires_at: null, listing_term: null });
      if (path === "/api/properties/listing-one/publish-free") return { ok: true, days: 15 };
      return response(path, options);
    });
    await prepareNewListing();
    expect(button("Publish free")).toBeTruthy();
    await submit();
    expect(
      request.mock.calls.filter(([path]) => path === "/api/properties/listing-one/publish-free"),
    ).toHaveLength(1);
    expect(
      request.mock.calls.some(
        ([path]) => path === "/api/wallet/order" || path === "/api/wallet/spend",
      ),
    ).toBe(false);
  });
  it("tops up only the shortfall and recovers failed verification before spending, without a second charge", async () => {
    let balance = 40;
    let verifies = 0;
    window.Razorpay = class {
      constructor(private options: Record<string, unknown>) {}
      on() {}
      open() {
        (this.options["handler"] as (proof: unknown) => void)({
          razorpay_order_id: "listing-order",
          razorpay_payment_id: "listing-payment",
          razorpay_signature: "test-proof",
        });
      }
    };
    request.mockImplementation(async (path, options) => {
      if (path === "/api/wallet") return { balance };
      if (path === "/api/uploads")
        return {
          file: {
            url: `https://images.example/${((options?.body as FormData).get("file") as File).name}`,
          },
        };
      if (path === "/api/properties" || path === "/api/properties/listing-one")
        return listingRecord({ status: "draft", expires_at: null, listing_term: null });
      if (path === "/api/wallet/order")
        return {
          key_id: "test-key",
          order_id: "listing-order",
          amount: 6000,
          currency: "INR",
          description: "Listing credits",
        };
      if (path === "/api/wallet/verify") {
        verifies++;
        if (verifies === 1) throw new Error("Verification temporarily unavailable");
        balance = 100;
        return { ok: true, balance };
      }
      if (path === "/api/wallet/spend") {
        balance = 0;
        return { ok: true, balance, charged: 100 };
      }
      return response(path, options);
    });
    await prepareNewListing();
    await submit();
    expect(request.mock.calls.some(([path]) => path === "/api/wallet/spend")).toBe(false);
    expect(container.textContent).toContain("Your payment needs verification");
    await submit();
    const orders = request.mock.calls.filter(([path]) => path === "/api/wallet/order");
    expect(orders).toHaveLength(1);
    expect(JSON.parse(String(orders[0]?.[1]?.body))).toEqual({ amount: 60 });
    expect(request.mock.calls.filter(([path]) => path === "/api/wallet/spend")).toHaveLength(1);
    expect(
      request.mock.calls.filter(
        ([path, options]) => path === "/api/properties" && options?.method === "POST",
      ),
    ).toHaveLength(1);
    expect(sessionStorage.getItem(`propertysetu_pending_payment:${user.id}`)).toBeNull();
    expect(navigate).toHaveBeenLastCalledWith({ view: "my-properties" });
  });
});

describe("Native mobile screen layouts", () => {
  beforeEach(() => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query === "(max-width: 700px)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: () => true,
    }));
  });
  afterEach(() => vi.restoreAllMocks());

  it("removes desktop appearance and deletion settings from the mobile profile", async () => {
    await mount(<ProfilePage />, { view: "profile" });
    expect(container.textContent).not.toContain("Appearance");
    expect(container.textContent).not.toContain("Delete account");
    expect(container.querySelector(".xp-theme-options")).toBeNull();
    expect(
      container.querySelector('[aria-label="Type DELETE to confirm account deletion"]'),
    ).toBeNull();
    expect(container.querySelector(".xp-profile-menu")).toBeNull();
    expect(container.querySelector(".xp-profile-language")?.textContent).toContain("English");
  });

  it("uses the profile city in the home header and prioritises that city without excluding other areas", async () => {
    request.mockImplementation(async (path, options) =>
      path === "/api/me"
        ? {
            ...response(path, options),
            profile: { id: user.id, full_name: "Test owner", city: "rkt" },
          }
        : response(path, options),
    );
    await mount(<ExplorerApp location={{ view: "home" }} navigate={navigate} />, { view: "home" });
    expect(container.querySelector(".home-city-picker")?.textContent).toBe("Rajkot");
    const calls = request.mock.calls.filter(([path]) => path.startsWith("/api/properties?"));
    const params = new URL(calls.at(-1)![0], "http://test.local").searchParams;
    expect(params.get("prefer_city")).toBe("Rajkot");
    expect(params.has("city")).toBe(false);
  });

  it("defaults to the IP city automatically and ignores an old manual city", async () => {
    vi.mocked(detectIpCity).mockResolvedValue("Surat");
    localStorage.setItem("propertysetu_browse_city", "Rajkot");
    await mount(
      <ExplorerApp location={{ view: "home" }} navigate={navigate} />,
      { view: "home" },
      false,
    );
    expect(container.querySelector(".home-city-picker")?.textContent).toBe("Surat");
    expect(request.mock.calls.some(([path]) => path.includes("prefer_city=Surat"))).toBe(true);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("lets a guest override the detected city for the current visit", async () => {
    await mount(
      <ExplorerApp location={{ view: "home" }} navigate={navigate} />,
      { view: "home" },
      false,
    );
    expect(container.querySelector(".home-city-picker")?.textContent).toBe("All properties");
    await act(async () => container.querySelector<HTMLButtonElement>(".home-city-picker")!.click());
    await fill('[role="dialog"] input', "Ahmedabad");
    await act(async () =>
      document
        .querySelector('[role="dialog"] form')!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(container.querySelector(".home-city-picker")?.textContent).toBe("Ahmedabad");
    expect(request.mock.calls.some(([path]) => path.includes("prefer_city=Ahmedabad"))).toBe(true);
  });

  it("uses the profile name initial in the mobile tab and keeps the profile free of navigation menus", async () => {
    await mount(
      <AppChrome>
        <ProfilePage />
      </AppChrome>,
      { view: "profile" },
    );
    expect(
      container.querySelector(
        'nav[aria-label="Mobile navigation"] a[aria-label="Profile"] .xp-tab-initial',
      )?.textContent,
    ).toBe("T");
    expect(container.querySelector(".xp-profile-menu")).toBeNull();
    expect(container.querySelector(".xp-native-header")).toBeNull();
  });

  it("lets guests choose a language, translates the profile, and restores the selection", async () => {
    await mount(
      <ExplorerLanguageProvider>
        <AppChrome>
          <ProfilePage />
        </AppChrome>
      </ExplorerLanguageProvider>,
      { view: "profile" },
      false,
    );
    expect(request.mock.calls.some(([path]) => path === "/api/wallet")).toBe(false);
    await act(async () =>
      container.querySelector<HTMLButtonElement>(".xp-profile-language")!.click(),
    );
    await act(async () =>
      Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'))
        .find((item) => item.textContent === "ગુજરાતી")!
        .click(),
    );
    expect(localStorage.getItem("propertyhub.language")).toBe("gu");
    expect(container.textContent).toContain("મહેમાન");
    expect(container.querySelector(".xp-profile-language")?.textContent).toContain("ગુજરાતી");
    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () =>
      root.render(<ExplorerApp location={{ view: "profile" }} navigate={navigate} />),
    );
    expect(container.textContent).toContain("મહેમાન");
    expect(container.textContent).not.toContain("Edit profile");
  });

  it.each([
    ["chats", "Messages"],
    ["inquiries", "Inquiries"],
    ["notifications", "Notifications"],
  ] as const)(
    "provides one native header with working back navigation on %s",
    async (view, title) => {
      localStorage.setItem("propertysetu_web_session", JSON.stringify(session));
      await mount(<ExplorerApp location={{ view }} navigate={navigate} />, { view });
      expect(container.querySelectorAll(".xp-native-header")).toHaveLength(1);
      expect(container.querySelector(".xp-native-header h1")?.textContent).toBe(title);
      await act(async () => container.querySelector<HTMLButtonElement>(".xp-native-back")!.click());
      expect(navigate).toHaveBeenLastCalledWith({ view: "home" });
    },
  );

  it("offers account deletion under About and waits for confirmation", async () => {
    expect(parseExplorerSearch({ view: "about" }).view).toBe("about");
    await mount(<AboutPage />, { view: "about" });
    expect(container.querySelector("input")).toBeNull();
    await click("Delete account");
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      "Permanently delete your account?",
    );
    expect(request.mock.calls.some(([, options]) => options?.method === "DELETE")).toBe(false);
    const cancel = document.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
    await act(async () => cancel.click());
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(localStorage.getItem("propertysetu_web_session")).toBeTruthy();
  });

  it("fills the property address fields from the current location and keeps them when going back", async () => {
    const geolocation = {
      getCurrentPosition: vi.fn((success) =>
        success({ coords: { latitude: 22.3, longitude: 70.8 } }),
      ),
    };
    vi.stubGlobal("navigator", Object.create(navigator, { geolocation: { value: geolocation } }));
    vi.mocked(reverseGeocode).mockResolvedValue({
      address: "12 Test Road, Rajkot",
      city: "Rajkot",
      locality: "Test locality",
      district: "Rajkot",
      state: "Gujarat",
      pincode: "360001",
    });
    try {
      await mount(<CreatePropertyPage />, { view: "create" });
      await click("Next");
      await click("Next");
      await click("Use my current location");
      expect(reverseGeocode).toHaveBeenCalledWith(22.3, 70.8);
      expect(container.querySelector<HTMLInputElement>('input[name="address"]')?.value).toBe(
        "12 Test Road, Rajkot",
      );
      expect(container.querySelector<HTMLInputElement>('input[name="city"]')?.value).toBe("Rajkot");
      expect(container.querySelector<HTMLInputElement>('input[name="locality"]')?.value).toBe(
        "Test locality",
      );
      expect(container.querySelector<HTMLInputElement>('input[name="pincode"]')?.value).toBe(
        "360001",
      );
      await click("Next");
      await click("Back");
      expect(container.querySelector<HTMLInputElement>('input[name="address"]')?.value).toBe(
        "12 Test Road, Rajkot",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("uses the app's eight listing steps and keeps the draft when going back", async () => {
    const listing = listingRecord();
    request.mockImplementation(async (path, options) =>
      path === "/api/properties/listing-one" ? listing : response(path, options),
    );
    await mount(<CreatePropertyPage id="listing-one" />, { view: "create", id: "listing-one" });
    expect(container.querySelector("progress")?.getAttribute("max")).toBe("8");
    expect(container.querySelector(".xp-kind-grid")).toBeTruthy();
    expect(container.querySelector('input[name="title"]')).toBeNull();
    await click("Next");
    expect(container.querySelector(".xp-listing-types")).toBeTruthy();
    await act(async () =>
      container.querySelector<HTMLButtonElement>('button[aria-label="Rent"]')!.click(),
    );
    await click("Next");
    expect(container.querySelector('input[name="address"]')).toBeTruthy();
    await click("Next");
    await fill('input[name="title"]', "Updated mobile home");
    await click("Back");
    await click("Next");
    expect(container.querySelector<HTMLInputElement>('input[name="title"]')?.value).toBe(
      "Updated mobile home",
    );
    await click("Next");
    expect(container.querySelector("input[multiple]")).toBeTruthy();
    expect(container.textContent).not.toContain("Supporting documents");
    await click("Next");
    expect(container.querySelector('input[name="price"]')).toBeTruthy();
    expect(container.textContent).toContain("Listing plan");
    await click("Next");
    expect(container.textContent).toContain("Amenities");
    expect(container.querySelector('input[type="file"]')).toBeNull();
    await click("Next");
    expect(container.querySelector("progress")?.getAttribute("value")).toBe("8");
    expect(container.querySelectorAll(".xp-native-document")).toHaveLength(6);
    expect(
      request.mock.calls.some(
        ([, options]) => options?.method === "POST" || options?.method === "PATCH",
      ),
    ).toBe(false);
    await submit();
    const update = request.mock.calls.find(
      ([path, options]) => path === "/api/properties/listing-one" && options?.method === "PATCH",
    );
    expect(JSON.parse(String(update?.[1]?.body))).toMatchObject({
      title: "Updated mobile home",
      listing_type: "rent",
      location: { city: "Rajkot" },
    });
    expect(navigate).toHaveBeenLastCalledWith({ view: "my-properties" });
  });

  it("keeps the photo requirement on the mobile media step", async () => {
    const listing = listingRecord({ images: [] });
    request.mockImplementation(async (path, options) =>
      path === "/api/properties/listing-one" ? listing : response(path, options),
    );
    await mount(<CreatePropertyPage id="listing-one" />, { view: "create", id: "listing-one" });
    for (let index = 0; index < 4; index++) await click("Next");
    await click("Next");
    expect(container.querySelector("progress")?.getAttribute("value")).toBe("5");
    expect(container.textContent).toContain("Add at least 2 photos");
  });

  it("filters notifications, groups dates and marks unread records on the server", async () => {
    let rows = [
      {
        id: "enquiry",
        type: "new_inquiry",
        title: "New enquiry",
        message: "A buyer is interested",
        created_at: new Date().toISOString(),
        is_read: false,
        data: { inquiry_id: "one" },
      },
      {
        id: "visit",
        type: "visit_request",
        title: "Visit requested",
        message: "View your visit",
        created_at: "2025-01-01T09:00:00Z",
        is_read: true,
        data: { visit_id: "one" },
      },
    ];
    request.mockImplementation(async (path, options) => {
      if (path === "/api/notifications") return rows;
      if (path === "/api/notifications/read") {
        rows = rows.map((row) => ({ ...row, is_read: true }));
        return { ok: true };
      }
      return response(path, options);
    });
    await mount(<NotificationsPage />, { view: "notifications" });
    expect(container.querySelector(".xp-native-header")?.textContent).toContain(
      "1 unread notification",
    );
    expect(container.querySelectorAll(".xp-notification-day")).toHaveLength(2);
    await click("Enquiries");
    expect(container.querySelectorAll(".xp-notification")).toHaveLength(1);
    expect(container.querySelector(".xp-notification")?.textContent).toContain("New enquiry");
    await click("Visits");
    expect(container.querySelector(".xp-notification")?.textContent).toContain("Visit requested");
    await click("Mark all as read");
    expect(
      request.mock.calls.some(
        ([path, options]) => path === "/api/notifications/read" && options?.method === "PATCH",
      ),
    ).toBe(true);
    expect(container.querySelector(".xp-native-header")?.textContent).toContain(
      "You're all caught up",
    );
  });

  it("uses compact owned cards with edit/delete icons and confirms deletion", async () => {
    let records = [listingRecord({ city: "Rajkot", locality: "Kalawad Road" })];
    request.mockImplementation(async (path, options) => {
      if (path.startsWith("/api/properties?mine=true")) return records;
      if (path === "/api/properties/listing-one?hard=true" && options?.method === "DELETE") {
        records = [];
        return { ok: true };
      }
      return response(path, options);
    });
    await mount(<MyPropertiesPage embedded />, { view: "profile" });
    const card = container.querySelector(".xp-native-owned")!;
    expect(card.querySelector('a[aria-label="Edit"]')?.getAttribute("href")).toBe(
      "/explore?view=create&id=listing-one",
    );
    expect(card.querySelector('a[aria-label="Edit"] svg')).toBeTruthy();
    expect(card.querySelector('button[aria-label="Delete"] svg')).toBeTruthy();
    expect(card.textContent).toContain("Kalawad Road, Rajkot");
    expect(card.querySelector("select")).toBeNull();
    expect(card.textContent).not.toContain("Archive");
    expect(card.textContent).not.toContain("Expires");
    await click("Delete");
    expect(request.mock.calls.some(([, options]) => options?.method === "DELETE")).toBe(false);
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain("Delete this property permanently?");
    await act(async () => dialog.querySelector<HTMLButtonElement>("button.danger")!.click());
    expect(
      request.mock.calls.some(
        ([path, options]) =>
          path === "/api/properties/listing-one?hard=true" && options?.method === "DELETE",
      ),
    ).toBe(true);
    expect(container.querySelector(".xp-native-owned")).toBeNull();
  });

  it("uses the native mark-as-sold action without changing status before confirmation", async () => {
    request.mockImplementation(async (path, options) =>
      path.startsWith("/api/properties?mine=true") ? [listingRecord()] : response(path, options),
    );
    await mount(<MyPropertiesPage embedded />, { view: "profile" });
    await click("Mark as sold");
    expect(request.mock.calls.some(([, options]) => options?.method === "PATCH")).toBe(false);
    const dialog = document.querySelector('[role="dialog"]')!;
    const confirm = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button")).find(
      (item) => item.textContent === "Mark as sold",
    )!;
    await act(async () => confirm.click());
    const update = request.mock.calls.find(
      ([path, options]) => path === "/api/properties/listing-one" && options?.method === "PATCH",
    );
    expect(JSON.parse(String(update?.[1]?.body))).toEqual({ status: "sold" });
  });

  it("uses the app's property status tabs", async () => {
    request.mockImplementation(async (path, options) =>
      path.startsWith("/api/properties?mine=true")
        ? [
            listingRecord(),
            listingRecord({ id: "sold-one", title: "Sold garden home", status: "sold" }),
          ]
        : response(path, options),
    );
    await mount(<MyPropertiesPage />, { view: "my-properties" });
    expect(container.querySelectorAll(".xp-owned")).toHaveLength(1);
    await click("Sold");
    expect(container.querySelector(".xp-owned")?.textContent).toContain("Sold garden home");
  });

  it("shows the native visit card and confirms a requested visit", async () => {
    request.mockImplementation(async (path, options) =>
      path === "/api/visits"
        ? [
            {
              id: "visit-one",
              property_id: "property-one",
              property_title: "Garden home",
              status: "requested",
              buyer_id: "buyer-one",
              scheduled_at: "2027-01-01T10:00:00Z",
              notes: null,
            },
          ]
        : response(path, options),
    );
    await mount(<VisitsPage />, { view: "visits" });
    expect(container.querySelector(".xp-native-visit")).toBeTruthy();
    expect(container.querySelector(".xp-visit-controls")?.hasAttribute("open")).toBe(false);
    await click("Confirm visit");
    const update = request.mock.calls.find(
      ([path, options]) => path === "/api/visits/visit-one" && options?.method === "PATCH",
    );
    expect(JSON.parse(String(update?.[1]?.body))).toEqual({ status: "confirmed" });
  });
});
