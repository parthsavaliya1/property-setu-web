import { THEME_PREVIEWS } from "./appTheme";
import { api, money } from "./propertysetu";
export const explorerViews = [
  "home",
  "search",
  "login",
  "details",
  "create",
  "saved",
  "profile",
  "about",
  "wallet",
  "history",
  "my-properties",
  "inquiries",
  "visits",
  "notifications",
  "chats",
  "chat",
  "saved-searches",
  "blocked",
  "map",
] as const;
export type ExplorerView = (typeof explorerViews)[number];
export type SearchFilters = Partial<
  Record<
    "q" | "city" | "min_price" | "max_price" | "bedrooms" | "category" | "listing_type",
    string
  >
>;
export type ExplorerLocation = {
  view: ExplorerView;
  id?: string;
  next?: ExplorerView;
} & SearchFilters;
export function parseExplorerSearch(raw: Record<string, unknown>): ExplorerLocation {
  const view = explorerViews.includes(raw["view"] as ExplorerView)
    ? (raw["view"] as ExplorerView)
    : "home";
  const id = typeof raw["id"] === "string" && raw["id"].length <= 200 ? raw["id"] : undefined;
  const next = explorerViews.includes(raw["next"] as ExplorerView)
    ? (raw["next"] as ExplorerView)
    : undefined;
  const filters: SearchFilters = {};
  for (const key of [
    "q",
    "city",
    "min_price",
    "max_price",
    "bedrooms",
    "category",
    "listing_type",
  ] as const) {
    const value = raw[key];
    if (typeof value === "string" && value.length <= 160) filters[key] = value;
  }
  return { view, ...(id ? { id } : {}), ...(next ? { next } : {}), ...filters };
}
export const explorerHref = (view: ExplorerView, id?: string) =>
  `/explore?${new URLSearchParams({ view, ...(id ? { id } : {}) })}`;
export function productRequest<T>(
  path: string,
  token?: string | null,
  method = "GET",
  body?: unknown,
) {
  return api<T>(
    `/api${path}`,
    {
      method,
      ...(body !== undefined
        ? { body: body instanceof FormData ? body : JSON.stringify(body) }
        : {}),
    },
    token || undefined,
    path === "/uploads" ? 180000 : path === "/properties/extract-from-image" ? 120000 : 20000,
  );
}
export async function uploadFile(
  file: File,
  token: string,
  kind: "image" | "video" | "document" = "image",
) {
  if (file.size > 80 * 1024 * 1024) throw new Error("Choose a file smaller than 80 MB.");
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  const data = await productRequest<{ file: { url: string } }>("/uploads", token, "POST", form);
  if (!data.file?.url) throw new Error("The upload did not return a file URL.");
  return data.file.url;
}
export const readable = (value: string | null | undefined) => {
  const text = (value || "").replaceAll("_", " ").replaceAll("-", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};
export const dateTime = (value?: string | null) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "Not scheduled";
export type ListingSettings = {
  standardPrice: number;
  premiumPrice: number;
  yearlyDiscountPercent: number;
};
export function planCharge(
  settings: ListingSettings,
  badge: "standard" | "premium",
  term: "month" | "year",
  current?: {
    status: string;
    expires_at: string | null;
    is_premium: boolean;
    listing_term?: string | null;
  } | null,
) {
  const fee = (b: "standard" | "premium", t: "month" | "year") =>
    t === "month"
      ? b === "premium"
        ? settings.premiumPrice
        : settings.standardPrice
      : Math.round(
          ((b === "premium" ? settings.premiumPrice : settings.standardPrice) *
            12 *
            (100 - Math.min(90, Math.max(0, settings.yearlyDiscountPercent)))) /
            100,
        );
  const live =
    current?.status === "published" &&
    current.listing_term !== "trial" &&
    (!current.expires_at || Date.parse(current.expires_at) > Date.now());
  return Math.max(
    0,
    fee(badge, term) -
      (live
        ? fee(
            current.is_premium ? "premium" : "standard",
            current.listing_term === "year" ? "year" : "month",
          )
        : 0),
  );
}

type Order = {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  description: string;
};
export type PaymentResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type Checkout = {
  open: () => void;
  on: (event: string, fn: (event: { error?: { description?: string } }) => void) => void;
};
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => Checkout;
  }
}
let checkoutScript: Promise<void> | undefined;
async function loadCheckout() {
  if (window.Razorpay) return;
  if (!checkoutScript)
    checkoutScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => {
        checkoutScript = undefined;
        script.remove();
        reject(new Error("Payment checkout could not load. Please try again."));
      };
      document.body.append(script);
    });
  await checkoutScript;
}
export async function topUpWallet(
  amount: number,
  token: string,
  onPayment?: (result: PaymentResult) => void,
) {
  await loadCheckout();
  const order = await productRequest<Order>("/wallet/order", token, "POST", { amount });
  const proof = await new Promise<PaymentResult>((resolve, reject) => {
    if (!window.Razorpay) return reject(new Error("Payment checkout is unavailable."));
    const checkout = new window.Razorpay({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      name: "PropertySetu",
      description: order.description,
      theme: {
        color:
          THEME_PREVIEWS.find((theme) => theme.key === document.documentElement.dataset["theme"])
            ?.primary || "#B56A45",
      },
      handler: resolve,
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled. Your balance has not been changed.")),
      },
    });
    checkout.on("payment.failed", (event) =>
      reject(new Error(event.error?.description || "Payment failed. Please try again.")),
    );
    checkout.open();
  });
  onPayment?.(proof);
  return productRequest<{ ok: boolean; balance: number }>("/wallet/verify", token, "POST", proof);
}

export const formatAmount = (value: number | string | null | undefined) =>
  money(Number(value) || 0);
