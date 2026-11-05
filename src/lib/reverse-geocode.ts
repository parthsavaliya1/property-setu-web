export type PropertyPlace = {
  address: string;
  city: string;
  locality: string;
  district: string;
  state: string;
  pincode: string;
};
const cache = new Map<string, PropertyPlace>();

// Only called after the user presses the current-location button.
export async function reverseGeocode(latitude: number, longitude: number): Promise<PropertyPlace> {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    throw new Error("The browser returned an invalid location. Please try again.");
  const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const saved = cache.get(key);
  if (saved) return saved;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const endpoint =
      import.meta.env["VITE_REVERSE_GEOCODE_URL"] || "https://photon.komoot.io/reverse";
    const url = new URL(endpoint);
    url.search = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      limit: "1",
      lang: "en",
    }).toString();
    const response = await fetch(url, { signal: controller.signal, credentials: "omit" });
    if (!response.ok) throw new Error("Address lookup failed.");
    const data = await response.json();
    const properties = data.features?.[0]?.properties;
    if (!properties || typeof properties !== "object") throw new Error("No address found.");
    const value = (...keys: string[]) => {
      for (const key of keys)
        if (typeof properties[key] === "string" && properties[key].trim())
          return properties[key].trim();
      return "";
    };
    const city = value("city", "town", "village", "municipality");
    const locality = value("district", "locality", "suburb", "neighbourhood");
    const district = value("county", "district");
    const state = value("state");
    const pincode = value("postcode");
    const street = [value("housenumber"), value("street")].filter(Boolean).join(" ");
    const address = [
      ...new Set([value("name"), street, locality, city, state, pincode].filter(Boolean)),
    ].join(", ");
    if (!address && !city) throw new Error("No address found.");
    const result = {
      address: address.slice(0, 300),
      city: city.slice(0, 120),
      locality: locality.slice(0, 120),
      district: district.slice(0, 120),
      state: state.slice(0, 120),
      pincode: pincode.slice(0, 12),
    };
    cache.set(key, result);
    return result;
  } catch {
    throw new Error(
      "Location found, but the address could not be loaded. Please enter the address details or try again.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
