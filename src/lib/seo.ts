// Keep the production origin shared by canonical URLs, social cards and structured data.
export const SITE_URL = "https://propertysetu.co.in";
export const PUBLIC_PATHS = [
  "/",
  "/listings",
  "/explore?view=home",
  "/features",
  "/how-it-works",
  "/privacy",
  "/terms",
  "/delete-account",
] as const;
const SHARE_IMAGE = `${SITE_URL}/images/hero-villa.jpg`;

export function metadata(
  title: string,
  description: string,
  path: string,
  options: { noindex?: boolean } = {},
) {
  const url = new URL(path, SITE_URL).href;
  const fullTitle = `${title} — PropertySetu`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "PropertySetu",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/images/logo-emblem.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "PropertySetu",
      url: `${SITE_URL}/`,
      inLanguage: "en-IN",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: fullTitle,
      description,
      inLanguage: "en-IN",
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
  ];
  if (path !== "/" && !options.noindex)
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: title, item: url },
      ],
    });
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      {
        name: "robots",
        content: options.noindex ? "noindex, follow" : "index, follow, max-image-preview:large",
      },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "PropertySetu" },
      { property: "og:locale", content: "en_IN" },
      { property: "og:url", content: url },
      { property: "og:image", content: SHARE_IMAGE },
      { property: "og:image:alt", content: "PropertySetu — find your next home in India" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: SHARE_IMAGE },
      { name: "twitter:image:alt", content: "PropertySetu — find your next home in India" },
    ],
    // Account and application states should not nominate the public explorer as a duplicate.
    links: options.noindex ? [] : [{ rel: "canonical", href: url }],
    scripts: options.noindex
      ? []
      : [
          {
            type: "application/ld+json",
            children: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(
              /</g,
              "\\u003c",
            ),
          },
        ],
  };
}

const EXPLORER_PAGES = {
  home: [
    "Explore properties",
    "Search properties for sale and rent across India and connect with owners on PropertySetu.",
  ],
  search: ["Search properties", "Search PropertySetu listings by city, budget and property type."],
  login: ["Sign in", "Sign in to your PropertySetu account using your mobile number."],
  details: [
    "Property details",
    "View property information, photos and contact options on PropertySetu.",
  ],
  create: [
    "List your property",
    "Add property details, photos and location to list your property on PropertySetu.",
  ],
  saved: ["Saved properties", "Review properties you have saved on PropertySetu."],
  profile: ["Your profile", "Manage your PropertySetu profile and account details."],
  about: ["About PropertySetu", "Learn about PropertySetu and find account support."],
  wallet: ["Your wallet", "Manage your PropertySetu wallet and listing payments."],
  history: ["Payment history", "Review your PropertySetu wallet transaction history."],
  "my-properties": ["My properties", "Manage your property listings on PropertySetu."],
  inquiries: ["Property inquiries", "Manage inquiries about your PropertySetu listings."],
  visits: ["Property visits", "Review and manage your property visit requests."],
  notifications: ["Notifications", "Read your PropertySetu account notifications."],
  chats: ["Your conversations", "View your property conversations on PropertySetu."],
  chat: ["Property conversation", "Continue your property conversation on PropertySetu."],
  "saved-searches": ["Saved searches", "Manage your saved property searches on PropertySetu."],
  blocked: ["Blocked accounts", "Manage accounts you have blocked on PropertySetu."],
  map: ["Property map", "Explore property locations on the PropertySetu map."],
} as const;

// Share one policy between route metadata and the HTTP X-Robots-Tag header.
export function explorerMetadata(search: Record<string, unknown>) {
  const view = typeof search["view"] === "string" ? search["view"] : "home";
  const [title, description] =
    EXPLORER_PAGES[view as keyof typeof EXPLORER_PAGES] ?? EXPLORER_PAGES.home;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (typeof value === "string") params.set(key, value);
  }
  return metadata(title, description, "/explore?view=home", {
    noindex: shouldNoindex(new URL(`/explore?${params}`, SITE_URL), 200),
  });
}

// Admin is client-rendered; HTTP headers exclude even its unhydrated HTML.
export function shouldNoindex(url: URL, status: number) {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  return (
    status >= 400 ||
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path === "/admin-preview" ||
    (path === "/explore" &&
      [...url.searchParams].some(([key, value]) =>
        key === "view"
          ? value !== "home"
          : [
              "id",
              "next",
              "q",
              "city",
              "min_price",
              "max_price",
              "bedrooms",
              "category",
              "listing_type",
            ].includes(key) && Boolean(value),
      ))
  );
}
