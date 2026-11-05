import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectIpCity } from "@/lib/ip-city";
import { reverseGeocode } from "@/lib/reverse-geocode";

const fetchMock = vi.fn();
beforeEach(() => {
  sessionStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("IP city defaults", () => {
  it("uses the visitor lookup without credentials and caches just the city", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ city: "Surat", ip: "192.0.2.1" }),
    });
    expect(await detectIpCity()).toBe("Surat");
    expect(await detectIpCity()).toBe("Surat");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ipapi.co/json/",
      expect.objectContaining({ credentials: "omit", referrerPolicy: "no-referrer" }),
    );
    expect(sessionStorage.getItem("propertysetu_ip_city")).not.toContain("192.0.2.1");
  });
  it("allows profile fallback when the IP service is unavailable or rate limited", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    expect(await detectIpCity()).toBe("");
    fetchMock.mockRejectedValue(new Error("offline"));
    expect(await detectIpCity()).toBe("");
  });
});

describe("Property address lookup", () => {
  it("maps the provider response to all address fields", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              housenumber: "12",
              street: "Test Road",
              district: "Test locality",
              county: "Rajkot",
              city: "Rajkot",
              state: "Gujarat",
              postcode: "360001",
            },
          },
        ],
      }),
    });
    const result = await reverseGeocode(22.3, 70.8);
    expect(result).toEqual({
      address: "12 Test Road, Test locality, Rajkot, Gujarat, 360001",
      city: "Rajkot",
      locality: "Test locality",
      district: "Rajkot",
      state: "Gujarat",
      pincode: "360001",
    });
    await reverseGeocode(22.3, 70.8);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("reports missing coverage instead of fabricating an address", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ features: [] }) });
    await expect(reverseGeocode(21, 72)).rejects.toThrow("address could not be loaded");
  });
});
