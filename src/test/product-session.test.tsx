import { api } from "@/lib/propertysetu";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnchorHTMLAttributes } from "react";
import { SiteHeader } from "@/components/propertysetu/site";
import { PRODUCT_SESSION_KEY, saveProductSession } from "@/lib/product-session";

vi.mock("@/lib/propertysetu", async (original) => ({
  ...(await original<typeof import("@/lib/propertysetu")>()),
  api: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    search,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; search?: Record<string, string> }) => (
    <a href={to + (search ? `?${new URLSearchParams(search)}` : "")} {...props} />
  ),
}));
const session = { token: "customer-test-token", user: { id: "customer-test" } };
beforeEach(() => {
  localStorage.clear();
  vi.mocked(api).mockReset();
  vi.mocked(api).mockResolvedValue({ profile: { full_name: "  Parth Shah " } });
});
afterEach(cleanup);

describe("Website customer login state", () => {
  it("replaces Sign in with the customer account link after restoring a login", async () => {
    localStorage.setItem(PRODUCT_SESSION_KEY, JSON.stringify(session));
    render(<SiteHeader />);
    await screen.findByText("P");
    expect(screen.getByRole("link", { name: "My account" })).toHaveTextContent("P");
    expect(screen.queryByText("My account")).toBeNull();
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
    expect(screen.getByRole("link", { name: "My account" })).toHaveAttribute(
      "href",
      "/explore?view=profile",
    );
  });
  it("does not treat an administrator login as a customer login", () => {
    localStorage.setItem("propertysetu_admin_token", "administrator-test-token");
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/explore?view=login",
    );
  });
  it("updates immediately when the customer signs in or out in the same tab", () => {
    render(<SiteHeader />);
    act(() => {
      saveProductSession(session);
    });
    expect(screen.getByRole("link", { name: "My account" })).toBeTruthy();
    act(() => {
      saveProductSession(null);
    });
    expect(screen.getByRole("link", { name: "Sign in" })).toBeTruthy();
  });
  it("updates after sign-out in another tab", () => {
    localStorage.setItem(PRODUCT_SESSION_KEY, JSON.stringify(session));
    render(<SiteHeader />);
    act(() => {
      localStorage.removeItem(PRODUCT_SESSION_KEY);
      window.dispatchEvent(
        new StorageEvent("storage", { key: PRODUCT_SESSION_KEY, newValue: null }),
      );
    });
    expect(screen.getByRole("link", { name: "Sign in" })).toBeTruthy();
  });
  it("handles malformed session storage as signed out", () => {
    localStorage.setItem(PRODUCT_SESSION_KEY, "invalid-json");
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Sign in" })).toBeTruthy();
  });
  it("uses an account icon when the profile has no name", async () => {
    vi.mocked(api).mockResolvedValue({ profile: { full_name: null } });
    localStorage.setItem(PRODUCT_SESSION_KEY, JSON.stringify(session));
    await act(async () => {
      render(<SiteHeader />);
    });
    const link = screen.getByRole("link", { name: "My account" });
    expect(link.textContent).toBe("");
    expect(link.querySelector("svg")).toBeTruthy();
  });
  it("does not show a previous account's initial after sign-out", async () => {
    localStorage.setItem(PRODUCT_SESSION_KEY, JSON.stringify(session));
    render(<SiteHeader />);
    await screen.findByText("P");
    act(() => {
      saveProductSession(null);
    });
    expect(screen.queryByText("P")).toBeNull();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeTruthy();
  });
});
