import { planCharge, type ListingSettings } from "./explorer";
export type ListingSnapshot = {
  status: string;
  expires_at: string | null;
  is_premium: boolean;
  listing_term?: string | null;
  listing_label?: string | null;
};
/** Mirrors property-app's chosenPlan, canPublishFree and paymentDue rules. */
export function listingPayment(
  settings: ListingSettings | null,
  selectedBadge: "standard" | "premium",
  selectedTerm: "month" | "year",
  current: ListingSnapshot | null | undefined,
  freeAvailable: boolean,
  lockExistingPlan = false,
) {
  const savedBadge =
    current?.is_premium || current?.listing_label === "Premium" ? "premium" : "standard";
  const savedTerm = current?.listing_term === "year" ? "year" : "month";
  const badge = lockExistingPlan && current ? savedBadge : selectedBadge;
  const term = lockExistingPlan && current ? savedTerm : selectedTerm;
  const live =
    current?.status === "published" &&
    (!current.expires_at || Date.parse(current.expires_at) > Date.now());
  const trial = current?.listing_term === "trial";
  const regularMonth = badge === "standard" && term === "month";
  const useFree = freeAvailable && !live && regularMonth;
  let due: number | null = null;
  if (useFree || (trial && live && regularMonth)) due = 0;
  else if (
    live &&
    !trial &&
    !(badge === "premium" && savedBadge !== "premium") &&
    !(term === "year" && savedTerm !== "year")
  )
    due = 0;
  else if (settings) due = planCharge(settings, badge, term, trial ? null : current);
  return { badge, term, live: Boolean(live), useFree, due };
}
