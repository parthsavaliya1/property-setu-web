import { useEffect } from "react";
import { API_URL } from "@/lib/propertysetu";
import { applyTheme, isThemeKey, THEME_STORAGE_KEY } from "@/lib/appTheme";
import { SeasonalWeather } from "./seasonal-weather";

/** Uses the last chosen theme immediately, then refreshes it from the backend. */
export function ThemeLoader() {
  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeKey(cached)) applyTheme(cached);
    } catch {
      // ignore storage errors
    }

    let cancelled = false;
    fetch(`${API_URL}/api/app-theme`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { theme?: unknown } | null) => {
        if (!cancelled && isThemeKey(data?.theme)) applyTheme(data.theme);
      })
      .catch(() => {
        // Keep the theme already on the page.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <SeasonalWeather />;
}
