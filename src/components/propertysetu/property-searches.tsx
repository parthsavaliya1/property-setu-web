import { ArrowUpRight, Building2, House, KeyRound, MapPin } from "lucide-react";
import { APP_URL } from "@/lib/propertysetu";

const searches = [
  {
    type: "sale",
    icon: House,
    title: "Buy a property",
    description:
      "Explore flats, apartments, independent houses and plots for sale. Compare locations, prices and property details before contacting the owner.",
    label: "Properties for sale",
  },
  {
    type: "rent",
    icon: KeyRound,
    title: "Find a rental home",
    description:
      "Search flats and houses for rent by city and budget. Review photos, shortlist your options and request a property visit.",
    label: "Homes for rent",
  },
  {
    type: "lease",
    icon: Building2,
    title: "Explore property for lease",
    description:
      "Browse residential and commercial property listings for lease. Contact the listing owner to discuss the space, lease terms and availability.",
    label: "Properties for lease",
  },
  {
    type: "pg",
    icon: MapPin,
    title: "Find PG accommodation",
    description:
      "Look for paying guest accommodation in your chosen city. Check the listing details and ask the owner about rent, facilities and house rules.",
    label: "PG and paying guest listings",
  },
];

// Match the category slugs supplied by the existing marketplace API.
const propertyGroups = [
  {
    title: "Residential properties",
    items: [
      ["Flats & apartments", "apartment"],
      ["Independent houses", "house"],
      ["Villas", "villa"],
      ["Bungalows", "bungalow"],
      ["Farmhouses", "farmhouse"],
      ["Penthouses", "penthouse"],
    ],
  },
  {
    title: "Plots & land",
    items: [
      ["Residential plots", "residential-plot"],
      ["Commercial plots", "commercial-plot"],
      ["Agricultural land", "agricultural-land"],
      ["Industrial land", "industrial-land"],
    ],
  },
  {
    title: "Commercial & other properties",
    items: [
      ["Shops", "shop"],
      ["Office spaces", "office"],
      ["Warehouses & godowns", "warehouse"],
      ["Showrooms", "showroom"],
      ["Hotels", "hotel"],
      ["Restaurants", "restaurant"],
      ["Other properties", "other-property"],
    ],
  },
];

const budgets = [
  { label: "Property under ₹25 lakh", type: "sale", price: "2500000" },
  { label: "Property under ₹50 lakh", type: "sale", price: "5000000" },
  { label: "Property under ₹1 crore", type: "sale", price: "10000000" },
  { label: "Rentals under ₹10,000", type: "rent", price: "10000" },
  { label: "Rentals under ₹20,000", type: "rent", price: "20000" },
  { label: "Rentals under ₹30,000", type: "rent", price: "30000" },
];

export function PropertySearches() {
  return (
    <section
      id="property-searches"
      className="section site-width property-searches"
      aria-labelledby="property-searches-title"
    >
      <div className="section-heading">
        <div>
          <div className="eyebrow text-primary">Start with what you need</div>
          <h2 id="property-searches-title">Explore property searches.</h2>
        </div>
        <p>
          Buy, rent or lease real estate in India. Browse homes, plots, land, commercial spaces and
          PG accommodation by property type, bedrooms, budget or location.
        </p>
      </div>
      <div className="property-searches-grid">
        {searches.map(({ type, icon: Icon, title, description, label }) => (
          <article className="property-search-option" key={type}>
            <Icon className="property-search-icon" aria-hidden="true" />
            <h3>{title}</h3>
            <p>{description}</p>
            <a href={`${APP_URL}?view=search&listing_type=${type}`}>
              {label}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>
      <form
        className="property-location-search"
        action={APP_URL}
        method="get"
        role="search"
        aria-label="Find property by city or area"
      >
        <input type="hidden" name="view" value="search" />
        <label>
          City
          <input name="city" placeholder="Enter your city" maxLength={160} />
        </label>
        <label>
          Area or property name
          <input name="q" placeholder="Search a locality or property" maxLength={160} />
        </label>
        <button type="submit">
          Search properties
          <ArrowUpRight size={17} aria-hidden="true" />
        </button>
      </form>
      <div className="property-search-groups">
        {propertyGroups.map(({ title, items }) => (
          <nav className="property-search-group" aria-label={title} key={title}>
            <h3>{title}</h3>
            <ul>
              {items.map(([label, category]) => (
                <li key={category}>
                  <a href={`${APP_URL}?view=search&category=${category}`}>
                    {label}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <nav className="property-bedroom-searches" aria-label="Search homes by number of bedrooms">
        <h3>Looking for a specific home size?</h3>
        <ul>
          {[1, 2, 3, 4, 5].flatMap((bedrooms) =>
            (["sale", "rent"] as const).map((type) => (
              <li key={`${bedrooms}-${type}`}>
                <a href={`${APP_URL}?view=search&listing_type=${type}&bedrooms=${bedrooms}`}>
                  {bedrooms} BHK homes for {type}
                </a>
              </li>
            )),
          )}
        </ul>
      </nav>
      <nav className="property-bedroom-searches" aria-label="Search properties by budget">
        <h3>Find a property within your budget</h3>
        <ul>
          {budgets.map(({ label, type, price }) => (
            <li key={label}>
              <a href={`${APP_URL}?view=search&listing_type=${type}&max_price=${price}`}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="property-search-actions">
        <a href={`${APP_URL}?view=map`}>
          Explore properties on the map
          <ArrowUpRight size={17} aria-hidden="true" />
        </a>
        <a href={`${APP_URL}?view=create`}>
          Post a property for sale, rent or lease
          <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
