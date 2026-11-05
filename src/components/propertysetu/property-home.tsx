import { detectIpCity } from "@/lib/ip-city";
import { useMobileLayout } from "./explorer/use-mobile-layout";
import { useExplorerLanguage } from "./explorer/language";
import { AnimatedLoader } from "@/components/ui/animated-loader";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  Heart,
  House,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { api } from "@/lib/propertysetu";
import { productRequest } from "@/lib/explorer";
import type { PropertyCard as Property } from "@/lib/explorer-types";
import { useExplorer, useAction, useResource } from "./explorer/context";
import { ActionError, ConfirmAction, ExploreLink, ExplorerCard, MenuItems } from "./explorer/ui";
import { Brand } from "./site";
import { AppCategoryIcon, type AppCategoryIconName } from "./category-icon";

const categories = [
  { name: "Buy", icon: "home", param: "listing_type", value: "sale" },
  { name: "Rent", icon: "home-city", param: "listing_type", value: "rent" },
  { name: "Plot", icon: "checkbox-blank-outline", param: "category", value: "residential-plot" },
  { name: "Land", icon: "upload", param: "category", value: "agricultural-land" },
  { name: "House", icon: "home-outline", param: "category", value: "house" },
  { name: "Apartment", icon: "office-building", param: "category", value: "apartment" },
  { name: "Villa", icon: "home-variant", param: "category", value: "villa" },
  { name: "Shop", icon: "storefront-outline", param: "category", value: "shop" },
] satisfies Array<{ name: string; icon: AppCategoryIconName; param: string; value: string }>;

export function PropertyHome() {
  const { text } = useExplorerLanguage();
  const app = useExplorer();
  const action = useAction();
  const mobile = useMobileLayout();
  const [chosenCity, setChosenCity] = useState("");
  const [ipCity, setIpCity] = useState("");
  const [locatingCity, setLocatingCity] = useState(true);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [cityDraft, setCityDraft] = useState("");
  const normalizeCity = (value: string) => {
    const clean = value.trim();
    if (/^(ahm|ahmed.*)$/i.test(clean)) return "Ahmedabad";
    if (/^(rkt|raj.*)$/i.test(clean)) return "Rajkot";
    return clean;
  };
  const browseCity = normalizeCity(chosenCity || ipCity || app?.me?.profile?.city || "");
  const preferredCity = mobile && app?.location.view === "home" ? browseCity : "";
  useEffect(() => {
    if (!mobile || app?.location.view !== "home") return;
    let active = true;
    setLocatingCity(true);
    void detectIpCity().then((detected) => {
      if (!active) return;
      setIpCity(detected);
      setLocatingCity(false);
    });
    return () => {
      active = false;
    };
  }, [mobile, app?.location.view]);

  const banners = useResource<Array<{ id: string; image_url: string }>>(app ? "/banners" : null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [city, setCity] = useState(app?.location.city || "");
  const [minPrice, setMinPrice] = useState(app?.location.min_price || "");
  const [beds, setBeds] = useState(app?.location.bedrooms || "");
  const [sort, setSort] = useState("recommended");
  const [listingType, setListingType] = useState(app?.location.listing_type || "");
  const [hasMore, setHasMore] = useState(false);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const queryKey = useRef("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState(app?.location.q || "");
  const [search, setSearch] = useState(app?.location.q || "");
  const [category, setCategory] = useState("");
  const [rows, setRows] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [budget, setBudget] = useState(app?.location.max_price || "");
  const selected = categories.find((item) => item.name === category);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ limit: "50" });
    if (search) params.set("q", search);
    if (selected) params.set(selected.param, selected.value);
    else if (app?.location.category) params.set("category", app.location.category);
    if (budget) params.set("max_price", budget);
    if (city) params.set("city", city);
    else if (preferredCity) params.set("prefer_city", preferredCity);
    if (minPrice) params.set("min_price", minPrice);
    if (beds) params.set("bedrooms", beds);
    if (listingType) params.set("listing_type", listingType);
    queryKey.current = params.toString();
    setLoading(true);
    setError(false);
    api<Property[]>(`/api/properties?${params}`, {}, app?.token || undefined)
      .then((data) => {
        if (active) {
          setRows(Array.isArray(data) ? data : []);
          setHasMore(Array.isArray(data) && data.length === 50);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setRows([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    search,
    selected,
    budget,
    city,
    minPrice,
    beds,
    listingType,
    attempt,
    app?.token,
    app?.refresh,
    preferredCity,
  ]);
  useEffect(() => {
    if (app?.location.view === "search") searchRef.current?.focus();
  }, [app?.location.view]);
  const slides = [
    "/images/app-home-banner.jpg",
    ...(banners.data || []).map((item) => item.image_url),
  ];
  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setBannerIndex((index) => (index + 1) % slides.length), 10000);
    return () => clearInterval(timer);
  }, [slides.length]);
  async function toggleSaved(row: Property) {
    if (!app?.requireLogin()) return;
    await productRequest(
      `/properties/${row.id}/favorite`,
      app.token,
      row.is_favorite ? "DELETE" : "POST",
    );
    setRows((previous) =>
      previous.map((item) =>
        item.id === row.id ? { ...item, is_favorite: !row.is_favorite } : item,
      ),
    );
    app.notify(row.is_favorite ? "Property removed from saved." : "Property saved.");
  }
  const ordered = [...rows].sort((left, right) =>
    sort === "low"
      ? Number(left.price) - Number(right.price)
      : sort === "high"
        ? Number(right.price) - Number(left.price)
        : 0,
  );

  const premium = ordered.filter((row) => row.is_premium || row.listing_label === "Premium");
  const standard = ordered.filter((row) => !row.is_premium && row.listing_label !== "Premium");
  const filtered = Boolean(search || category || budget || city || minPrice || beds || listingType);
  const appLink = (title: string, Icon: typeof House) => (
    <ExploreLink
      view={title === "Wallet" ? "wallet" : "notifications"}
      className="home-icon-button"
      aria-label={title}
      title={title}
    >
      <Icon className="home-web-utility-icon" />
      <span
        className={`home-native-utility-icon ${title === "Wallet" ? "is-wallet" : "is-bell"}`}
        aria-hidden="true"
      >
        {String.fromCodePoint(title === "Wallet" ? 63014 : 62591)}
      </span>
    </ExploreLink>
  );

  const isSearch = app?.location.view === "search";
  return (
    <div className={`property-home ${isSearch ? "home-search-page" : ""}`}>
      <a className="home-skip" href="#home-listings">
        Skip to properties
      </a>
      <main className="home-container home-main">
        <div className="home-sticky-search">
          <div className="home-topline">
            <div className="home-location">
              <button
                className="home-mobile-brand"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
              >
                <img src="/images/app-menu-logo.png" alt="" />
              </button>
              <div>
                <span className="home-location-caption">
                  <MapPin size={13} />
                  YOUR NEXT ADDRESS
                </span>
                <h1>
                  <span className={isSearch ? "" : "home-desktop-title"}>
                    {text(isSearch ? "Search properties" : "All properties")}
                  </span>
                  {!isSearch && (
                    <button
                      className="home-city-picker"
                      aria-label={browseCity ? `Change city: ${browseCity}` : "Choose your city"}
                      onClick={() => {
                        setCityDraft(browseCity);
                        setCityPickerOpen(true);
                      }}
                    >
                      {browseCity || text(locatingCity ? "Finding city" : "All properties")}
                    </button>
                  )}
                </h1>
                <p>{text("Find the right property for you")}</p>
              </div>
            </div>
            <div className="home-utilities">
              {appLink("Notifications", Bell)}
              {appLink("Wallet", Wallet)}
            </div>
          </div>
          <div className="home-intro">
            <span>FIND A PLACE TO CALL YOURS</span>
            <h2>
              A new address.
              <br />A world of possibilities.
            </h2>
            <p>
              From your first home to your next investment,
              <br />
              start your search with PropertySetu.
            </p>
          </div>
          <form
            className="home-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              if (
                app &&
                app.location.view === "home" &&
                window.matchMedia("(max-width: 700px)").matches
              ) {
                app.search({ q: query.trim() });
                return;
              }
              setSearch(query.trim());
            }}
          >
            <Search size={21} />
            <input
              ref={searchRef}
              aria-label="Search properties"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search city, area or property…"
            />
            <button
              type="button"
              className={`home-filter-button ${filtersOpen ? "active" : ""}`}
              aria-label="Property filters"
              aria-expanded={filtersOpen}
              aria-controls="home-filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={19} />
              <span>Filters</span>
            </button>
            <button type="submit" className="home-search-submit">
              Search
              <ArrowRight size={17} />
            </button>
          </form>
        </div>
        {filtersOpen && (
          <div className="home-filters" id="home-filters">
            <label htmlFor="home-budget">Maximum price</label>
            <select
              id="home-budget"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
            >
              <option value="">Any budget</option>
              <option value="1000000">₹10 lakh</option>
              <option value="5000000">₹50 lakh</option>
              <option value="10000000">₹1 crore</option>
              <option value="20000000">₹2 crore</option>
            </select>
          </div>
        )}
        {filtersOpen && (
          <div className="xp-home-extra-filters">
            <label>
              City
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Any city"
              />
            </label>
            <label>
              Minimum price (₹)
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </label>
            <label>
              Bedrooms
              <select value={beds} onChange={(e) => setBeds(e.target.value)}>
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Listing type
              <select value={listingType} onChange={(e) => setListingType(e.target.value)}>
                <option value="">Any</option>
                {["sale", "rent", "lease", "pg"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        <div className="xp-browse-tools">
          <ExploreLink view="map">
            <MapPin size={15} />
            Map view
          </ExploreLink>
          <button
            onClick={() => {
              if (app?.requireLogin()) setSaveSearchOpen(true);
            }}
          >
            Save search
          </button>
          <select
            aria-label="Sort properties"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recommended">Recommended</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
        <ActionError error={action.error} />
        <section className="home-categories" aria-label="Property categories">
          <div className="home-category-heading">
            <h2>What are you looking for?</h2>
            <span>A space for every plan</span>
          </div>
          <div className="home-category-grid">
            {categories.map(({ name, icon }) => (
              <button
                key={name}
                className={`home-category ${category === name ? "selected" : ""}`}
                aria-pressed={category === name}
                onClick={() => setCategory(category === name ? "" : name)}
              >
                <span className="home-category-icon">
                  <AppCategoryIcon name={icon} />
                </span>
                <span>{name}</span>
              </button>
            ))}
          </div>
        </section>
        <a href="#home-listings" className="home-banner">
          <img
            src={slides[bannerIndex % slides.length]}
            alt={bannerIndex > 0 ? "PropertySetu promotion" : ""}
          />
          <div hidden={bannerIndex > 0}>
            <span className="home-banner-kicker">YOUR NEXT CHAPTER</span>
            <h2>{text("Find your dream home")}</h2>
            <p>{text("Homes, plots, and land")}</p>
            <span className="home-banner-action">
              {text("Explore now")} <ArrowRight size={14} />
            </span>
          </div>
        </a>
        <div id="home-listings" className="home-results" aria-live="polite" aria-busy={loading}>
          {filtered && (
            <div className="home-result-summary">
              <span>
                {search ? `Results for “${search}”` : category || "Properties within your budget"}
                {!loading && !error ? ` · ${rows.length} properties` : ""}
              </span>
              <button
                onClick={() => {
                  setQuery("");
                  setSearch("");
                  setCategory("");
                  setBudget("");
                  setCity("");
                  setMinPrice("");
                  setBeds("");
                  setListingType("");
                }}
              >
                Clear filters
                <X size={14} />
              </button>
            </div>
          )}
          {loading ? (
            <AnimatedLoader fullScreen label="Loading properties" />
          ) : error ? (
            <div className="home-empty" role="status">
              <Building2 />
              <h2>We couldn’t load properties</h2>
              <p>Please check your connection and try again.</p>
              <button className="home-post" onClick={() => setAttempt(attempt + 1)}>
                Try again
                <ArrowRight size={16} />
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="home-empty">
              <House />
              <h2>
                {filtered ? "No matching properties yet" : "Your next place is on the horizon"}
              </h2>
              <p>
                {filtered
                  ? "Try another area, category or budget to explore more."
                  : "Check back soon for new property listings."}
              </p>
            </div>
          ) : (
            <>
              {premium.length > 0 && (
                <section>
                  <div className="home-section-title">
                    <div>
                      <span>EXCEPTIONAL SPACES</span>
                      <h2>Premium properties</h2>
                    </div>
                    <span className="home-section-count">{premium.length} properties</span>
                  </div>
                  <div className="home-premium-grid">
                    {premium.map((row) => (
                      <ExplorerCard
                        key={row.id}
                        row={row}
                        saved={row.is_favorite}
                        onSave={() => void action.run(() => toggleSaved(row))}
                      />
                    ))}
                  </div>
                </section>
              )}
              {standard.length > 0 && (
                <section>
                  <div className="home-section-title">
                    <div>
                      <span>EXPLORE THE POSSIBILITIES</span>
                      <h2>Simple properties</h2>
                    </div>
                    <span className="home-section-count">{standard.length} properties</span>
                  </div>
                  <div className="property-grid home-property-grid">
                    {standard.map((row) => (
                      <ExplorerCard
                        key={row.id}
                        row={row}
                        saved={row.is_favorite}
                        onSave={() => void action.run(() => toggleSaved(row))}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
          {hasMore && !loading && !error && (
            <button
              disabled={action.busy}
              className="xp-button secondary xp-load-more"
              onClick={() =>
                void action.run(async () => {
                  const params = new URLSearchParams(queryKey.current);
                  params.set("offset", String(rows.length));
                  const requestedKey = queryKey.current;
                  const next = await productRequest<Property[]>(
                    `/properties?${params}`,
                    app?.token,
                  );
                  if (requestedKey !== queryKey.current) return;
                  setRows((previous) => {
                    const ids = new Set(previous.map((row) => row.id));
                    return [...previous, ...next.filter((row) => !ids.has(row.id))];
                  });
                  setHasMore(next.length === 50);
                })
              }
            >
              {action.busy ? "Loading…" : "Load more properties"}
            </button>
          )}
        </div>
        <aside className="home-owner-card">
          <span className="home-owner-icon">
            <House size={28} />
          </span>
          <div>
            <h2>Have a property to share?</h2>
            <p>Help someone find their next beginning.</p>
          </div>
          <ExploreLink view="create">
            List your property
            <ArrowUpRight size={18} />
          </ExploreLink>
        </aside>
        <footer className="home-footer">
          <Brand />
          <p>Bringing people and places together.</p>
          <div>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/how-it-works">How it works</Link>
          </div>
          <span>© 2026 PropertySetu</span>
        </footer>
      </main>
      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="home-menu-backdrop" />
          <Dialog.Content className="home-menu" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
            <div>
              <Brand />
              <Dialog.Close aria-label="Close menu">
                <X />
              </Dialog.Close>
            </div>
            {app && <MenuItems onClose={() => setMenuOpen(false)} />}
            {app?.token && (
              <ConfirmAction
                label="Sign out"
                title="Sign out?"
                description="You can sign in again using your mobile number."
                onConfirm={async () => {
                  app.signOut();
                  setMenuOpen(false);
                  app.go("home");
                }}
              />
            )}
            <Link to="/">Back to website</Link>
            <Link to="/privacy">Privacy policy</Link>
            <Link to="/terms">Terms and community rules</Link>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={cityPickerOpen} onOpenChange={setCityPickerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="xp-modal-overlay" />
          <Dialog.Content className="xp-modal" aria-describedby="browse-city-description">
            <Dialog.Title>Choose your city</Dialog.Title>
            <Dialog.Description id="browse-city-description">
              Properties in your city appear first, followed by listings in other areas.
            </Dialog.Description>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const next = normalizeCity(cityDraft);
                if (!next) return;
                setChosenCity(next);
                setCityPickerOpen(false);
              }}
            >
              <label className="xp-field">
                <span>City</span>
                <input
                  autoComplete="address-level2"
                  value={cityDraft}
                  onChange={(event) => setCityDraft(event.target.value)}
                  maxLength={80}
                  placeholder="Enter your city"
                  required
                />
              </label>
              <div className="xp-actions">
                <Dialog.Close className="xp-button secondary" type="button">
                  Cancel
                </Dialog.Close>
                <button className="xp-button" disabled={!cityDraft.trim()}>
                  Use this city
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={saveSearchOpen} onOpenChange={setSaveSearchOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="xp-modal-overlay" />
          <Dialog.Content className="xp-modal">
            <Dialog.Title>Save this search</Dialog.Title>
            <Dialog.Description>
              We’ll notify you when matching properties are listed.
            </Dialog.Description>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void action.run(async () => {
                  await productRequest("/saved-searches", app?.token, "POST", {
                    name: searchName,
                    ...(search ? { q: search } : {}),
                    ...(city ? { city } : {}),
                    ...(budget ? { max_price: Number(budget) } : {}),
                    ...(minPrice ? { min_price: Number(minPrice) } : {}),
                    ...(beds ? { bedrooms: Number(beds) } : {}),
                    ...(listingType
                      ? { listing_type: listingType }
                      : selected?.param === "listing_type"
                        ? { listing_type: selected.value }
                        : {}),
                    ...(selected?.param === "category" ? { category_slug: selected.value } : {}),
                  });
                  setSaveSearchOpen(false);
                  app?.notify("Search saved.");
                });
              }}
            >
              <label className="xp-field">
                <span>Search name</span>
                <input
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  required
                  maxLength={80}
                />
              </label>
              <ActionError error={action.error} />
              <div className="xp-actions">
                <Dialog.Close className="xp-button secondary" type="button">
                  Cancel
                </Dialog.Close>
                <button className="xp-button" disabled={action.busy}>
                  Save search
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
