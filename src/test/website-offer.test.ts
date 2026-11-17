import { describe, expect, it } from "vitest";
import { planCharge } from "@/lib/explorer";
import { listingPayment } from "@/lib/listing-payment";

const prices = { standardPrice: 80, premiumPrice: 100, yearlyDiscountPercent: 20 };

describe("website listing offers", () => {
  it.each([[50, 40], [40, 48], [0, 80]])("applies %i percent to an ₹80 listing", (websiteOfferPercent, due) => {
    expect(listingPayment({ ...prices, websiteOfferPercent }, "standard", "month", null, false))
      .toMatchObject({ due, originalDue: 80 });
  });
  it("applies the website offer after the yearly discount", () => {
    expect(planCharge({ ...prices, websiteOfferPercent: 50 }, "premium", "year")).toBe(480);
  });
  it("preserves free trials and does not advertise paid savings on them", () => {
    expect(listingPayment({ ...prices, websiteOfferPercent: 50 }, "standard", "month", null, true))
      .toMatchObject({ due: 0, originalDue: 0, useFree: true });
  });
  it("preserves existing prices when connected to an older API", () => {
    expect(planCharge(prices, "standard", "month")).toBe(80);
  });
  it.each([Number.NaN, -1, 100, 10.5])("blocks invalid website offer %s", websiteOfferPercent => {
    expect(listingPayment({ ...prices, websiteOfferPercent }, "standard", "month", null, false).due).toBeNull();
  });
});
