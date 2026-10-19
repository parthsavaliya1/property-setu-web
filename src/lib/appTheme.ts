export const THEME_KEYS = [
  "terracotta",
  "fresh-green",
  "cream-mango",
  "classic-green",
  "olive-ivory",
  "teal-pistachio",
  "winter",
  "summer",
  "monsoon",
] as const;

export type ThemeKey = (typeof THEME_KEYS)[number];

/** Current PropertySetu colours. This stays the look until an admin picks another theme. */
export const DEFAULT_THEME: ThemeKey = "terracotta";

export const THEME_STORAGE_KEY = "propertysetu-theme";

export type ThemePreview = {
  key: ThemeKey;
  name: string;
  description: string;
  page: string;
  card: string;
  primary: string;
  ink: string;
  soft: string;
  badge: string;
  badgeText: string;
  animated?: boolean;
};

export const THEME_PREVIEWS: ThemePreview[] = [
  {
    key: "terracotta",
    name: "Terracotta",
    description: "The current PropertySetu look: cream pages, terracotta buttons, peach highlights.",
    page: "#F7F3EC",
    card: "#FFFFFF",
    primary: "#B56A45",
    ink: "#171717",
    soft: "#F3E4DB",
    badge: "#FFE4D1",
    badgeText: "#171717",
  },
  {
    key: "fresh-green",
    name: "Fresh Green",
    description: "Light mint pages, forest-green buttons, sage badges.",
    page: "#F8FCF6",
    card: "#FCFEFA",
    primary: "#276438",
    ink: "#183D25",
    soft: "#E4F0DF",
    badge: "#D3EAC5",
    badgeText: "#183D25",
  },
  {
    key: "cream-mango",
    name: "Cream & Mango",
    description: "Warm cream pages, leaf-green buttons, mango offer badges.",
    page: "#FFF8EC",
    card: "#FFFFFF",
    primary: "#2F6B3C",
    ink: "#243B2A",
    soft: "#FBEBD3",
    badge: "#F4A340",
    badgeText: "#243B2A",
  },
  {
    key: "classic-green",
    name: "Classic Green",
    description: "Farm-green buttons, dark-green headings, solid green badges.",
    page: "#F5F7F2",
    card: "#FFFFFF",
    primary: "#2E7D32",
    ink: "#1B5E20",
    soft: "#E8F5E9",
    badge: "#2E7D32",
    badgeText: "#FFFFFF",
  },
  {
    key: "olive-ivory",
    name: "Olive & Ivory",
    description: "Warm ivory pages, deep olive buttons, soft lime badges.",
    page: "#FAF9F3",
    card: "#FFFFFF",
    primary: "#4B6036",
    ink: "#293124",
    soft: "#E9EEDC",
    badge: "#DCE8B6",
    badgeText: "#293124",
  },
  {
    key: "teal-pistachio",
    name: "Teal & Pistachio",
    description: "Soft white pages, deep teal buttons, pale pistachio chips.",
    page: "#F7FAF8",
    card: "#FFFFFF",
    primary: "#176B52",
    ink: "#203B32",
    soft: "#E3EED5",
    badge: "#E3EED5",
    badgeText: "#203B32",
  },
  {
    key: "winter",
    name: "Winter",
    description: "Icy blue pages and deep blue buttons, with falling snowflakes.",
    page: "#F4F7FA",
    card: "#FFFFFF",
    primary: "#1E5690",
    ink: "#163044",
    soft: "#E3F0F8",
    badge: "#D6EBFA",
    badgeText: "#163044",
    animated: true,
  },
  {
    key: "summer",
    name: "Summer",
    description: "Warm sunlit pages and mango-orange buttons, with a glowing sun.",
    page: "#FFF6E8",
    card: "#FFFFFF",
    primary: "#E07A1F",
    ink: "#3A2410",
    soft: "#FFE8C8",
    badge: "#FFB020",
    badgeText: "#3A2410",
    animated: true,
  },
  {
    key: "monsoon",
    name: "Monsoon",
    description: "Storm-blue pages and rain-blue buttons, with falling raindrops.",
    page: "#E6F1F7",
    card: "#FFFFFF",
    primary: "#0D6484",
    ink: "#102833",
    soft: "#DEEDF4",
    badge: "#D4ECF6",
    badgeText: "#102833",
    animated: true,
  },
];

export function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === "string" && (THEME_KEYS as readonly string[]).includes(value);
}

export function applyTheme(theme: ThemeKey) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset['theme'] = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable; the attribute is still set.
  }
}
