const cacheKey = "propertysetu_ip_city";
const cacheLifetime = 30 * 60 * 1000;
let pending: Promise<string> | undefined;

// Run in the visitor's browser so the service looks up the visitor's IP,
// rather than the web server's IP. Never send account data or credentials.
export async function detectIpCity(): Promise<string> {
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
    if (typeof cached?.city === "string" && cached.city && cached.expires > Date.now())
      return cached.city;
  } catch {
    /* Storage is optional. */
  }
  if (pending) return pending;
  pending = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch("https://ipapi.co/json/", {
        signal: controller.signal,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) return "";
      const result = await response.json();
      if (result.error || typeof result.city !== "string") return "";
      const city = result.city.trim();
      if (!city || city.length > 80) return "";
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ city, expires: Date.now() + cacheLifetime }),
        );
      } catch {
        /* Detection also works with browser storage disabled. */
      }
      return city;
    } catch {
      return "";
    } finally {
      clearTimeout(timeout);
    }
  })();
  try {
    return await pending;
  } finally {
    pending = undefined;
  }
}
