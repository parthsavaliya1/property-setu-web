import { reverseGeocode } from "@/lib/reverse-geocode";
import { AnimatedLoader } from "@/components/ui/animated-loader";
import { listingPayment } from "@/lib/listing-payment";
import { useWalletTopUp } from "./wallet-funding";
import * as Dialog from "@radix-ui/react-dialog";
import { LoginPage } from "./auth";
import { MobilePageHeader } from "./mobile";
import { useMobileLayout } from "./use-mobile-layout";
import { useEffect, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { Fragment } from "react/jsx-runtime";
import {
  Tag,
  KeyRound,
  FileCheck2,
  BedDouble,
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  FileText,
  CloudUpload,
  MapPin,
  Sparkles,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { displayPrice } from "@/lib/propertysetu";
import {
  formatAmount,
  productRequest,
  readable,
  uploadFile,
  type ListingSettings,
} from "@/lib/explorer";
import type { Category, PropertyDetail } from "@/lib/explorer-types";
import { useAction, useProduct, useResource } from "./context";
import { ActionError, ExploreLink, Field, PageHeading, RemoteState } from "./ui";
const listingIntents = [
  {
    value: "sale",
    label: "Sell",
    description: "Find the right buyer for your property",
    icon: Tag,
  },
  {
    value: "rent",
    label: "Rent",
    description: "Offer your property for monthly rent",
    icon: KeyRound,
  },
  {
    value: "lease",
    label: "Lease",
    description: "Let your property on a lease agreement",
    icon: FileCheck2,
  },
  {
    value: "pg",
    label: "PG / Co-living",
    description: "List shared living or paying guest spaces",
    icon: BedDouble,
  },
] as const;

const desktopSteps = [
  "Property type",
  "The details",
  "Location",
  "Photos & documents",
  "Review & publish",
];
const initial = {
  is_price_negotiable: "false",
  title: "",
  description: "",
  category_slug: "house",
  listing_type: "sale",
  price: "",
  price_unit: "total",
  area: "",
  area_unit: "sq_ft",
  bedrooms: "",
  bathrooms: "",
  balconies: "",
  floor_number: "",
  total_floors: "",
  parking_spaces: "",
  built_up_area: "",
  carpet_area: "",
  plot_area: "",
  furnishing_status: "unfurnished",
  construction_year: "",
  possession_status: "Ready to move",
  facing: "",
  address: "",
  locality: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  latitude: "",
  longitude: "",
  maintenance_charge: "",
  security_deposit: "",
};
const numericKeys = [
  "price",
  "area",
  "bedrooms",
  "bathrooms",
  "balconies",
  "floor_number",
  "total_floors",
  "parking_spaces",
  "built_up_area",
  "carpet_area",
  "plot_area",
  "construction_year",
] as const;
type Draft = typeof initial;
function buildPropertyPayload(
  draft: Draft,
  photos: string[],
  video: string,
  amenities: string[],
  features: string[],
  documents: Record<string, string>,
  current?: PropertyDetail | null,
) {
  const numbers = Object.fromEntries(
    numericKeys.filter((key) => draft[key] !== "").map((key) => [key, Number(draft[key])]),
  );
  return {
    category_slug: draft.category_slug,
    title: draft.title.trim(),
    description: draft.description,
    listing_type: draft.listing_type,
    ...numbers,
    is_price_negotiable: draft.is_price_negotiable === "true",
    price_unit: draft.price_unit,
    area_unit: draft.area_unit,
    furnishing_status: draft.furnishing_status,
    possession_status: draft.possession_status,
    ...(draft.facing
      ? {
          facing: draft.facing,
        }
      : {}),
    status: current?.status === "published" ? "published" : "draft",
    location: {
      ...Object.fromEntries(
        ["address", "locality", "city", "district", "state", "pincode"].map((key) => [
          key,
          draft[key as keyof Draft],
        ]),
      ),
      ...(draft.latitude !== ""
        ? {
            latitude: Number(draft.latitude),
          }
        : {}),
      ...(draft.longitude !== ""
        ? {
            longitude: Number(draft.longitude),
          }
        : {}),
    },
    images: [
      ...photos.map((image_url, index) => ({
        image_url,
        image_type: "gallery",
        is_cover: index === 0,
      })),
      ...(video
        ? [
            {
              image_url: video,
              image_type: "video",
              is_cover: false,
            },
          ]
        : []),
    ],
    amenity_ids: amenities,
    features: features.map((feature_key) => ({
      feature_key,
    })),
    ...(draft.price
      ? {
          pricing: {
            price: Number(draft.price),
            price_type:
              draft.price_unit === "per_sqft"
                ? "per_sqft"
                : draft.listing_type === "rent"
                  ? "monthly_rent"
                  : "sale",
            ...(draft.maintenance_charge
              ? {
                  maintenance_charge: Number(draft.maintenance_charge),
                }
              : {}),
            ...(draft.security_deposit
              ? {
                  security_deposit: Number(draft.security_deposit),
                }
              : {}),
          },
        }
      : {}),
    documents: Object.entries(documents).map(([document_type, document_url]) => ({
      document_type,
      document_url,
    })),
  };
}
export function CreatePropertyPage({ id }: { id?: string }) {
  const app = useProduct();
  const action = useAction();
  const [loginOpen, setLoginOpen] = useState(false);
  function runAuthenticated(work: () => Promise<void>) {
    if (!app.token) {
      setLoginOpen(true);
      return;
    }
    action.run(work);
  }
  const mobile = useMobileLayout();
  const [desktopStep, setDesktopStep] = useState(0);
  const [mobileStep, setMobileStep] = useState(0);
  const step = mobile ? mobileStep : desktopStep;
  const setStep = mobile ? setMobileStep : setDesktopStep;
  const steps = mobile
    ? [
        "Property type",
        "Listing type",
        "Property location",
        "Property details",
        "Photos & video",
        "Pricing & plan",
        "Amenities & features",
        "Documents",
      ]
    : desktopSteps;
  const finalStep = mobile ? 7 : 4;
  const [draft, setDraft] = useState(initial);
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [documentType, setDocumentType] = useState("ownership_proof");
  const [savedId, setSavedId] = useState(id);
  const [badge, setBadge] = useState<"standard" | "premium">("standard");
  const [term, setTerm] = useState<"month" | "year">("month");
  const funding = useWalletTopUp();
  const [billingSnapshot, setBillingSnapshot] = useState<PropertyDetail | null>(null);
  const [saved, setSaved] = useState(false);
  const existing = useResource<PropertyDetail>(
    id && app.token ? `/properties/${encodeURIComponent(id)}` : null,
    app.token,
  );
  const categories = useResource<Category[]>("/categories");
  const amenitiesList = useResource<{ id: string; name: string }[]>("/amenities");
  const settings = useResource<ListingSettings>("/listing-settings");
  const eligible = useResource<{ available: boolean }>(
    app.token ? "/me/free-listing" : null,
    app.token,
  );
  const wallet = useResource<{ balance: number }>(app.token ? "/wallet" : null, app.token);
  useEffect(() => {
    if (!existing.data) return;
    const item = existing.data;
    setDraft((previous) => ({
      ...previous,
      ...Object.fromEntries(
        Object.keys(initial)
          .filter((key) => item[key as keyof PropertyDetail] != null)
          .map((key) => [key, String(item[key as keyof PropertyDetail])]),
      ),
      category_slug: item.category_slug || "house",
      maintenance_charge: String(item.prices?.[0]?.maintenance_charge || ""),
      security_deposit: String(item.prices?.[0]?.security_deposit || ""),
    }));
    setPhotos(
      item.images
        ?.filter((image) => image.image_type !== "video")
        .map((image) => image.image_url) || [],
    );
    setVideo(item.images?.find((image) => image.image_type === "video")?.image_url || "");
    setAmenities(item.amenities?.map((amenity) => amenity.id) || []);
    setFeatures(
      item.features
        ?.filter((feature) => !["listing_term", "listing_badge"].includes(feature.feature_key))
        .map((feature) => feature.feature_key) || [],
    );
    setBadge(item.is_premium || item.listing_label === "Premium" ? "premium" : "standard");
    setTerm(item.listing_term === "year" ? "year" : "month");
  }, [existing.data]);
  const current = billingSnapshot || existing.data;
  const payment = listingPayment(
    settings.data,
    badge,
    term,
    current,
    eligible.data?.available === true,
    Boolean(id),
  );
  const { due, useFree: free } = payment;
  const owned = !current || current.owner_id === app.session?.user.id;
  function set(key: keyof Draft, value: string) {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
    setSaved(false);
  }
  function text(
    key: keyof Draft,
    label: string,
    options: InputHTMLAttributes<HTMLInputElement> = {},
  ) {
    return (
      <Field label={label}>
        <input
          name={key}
          type={options.type || "text"}
          value={draft[key]}
          onChange={(event) => set(key, event.target.value)}
          step={
            [
              "latitude",
              "longitude",
              "price",
              "area",
              "maintenance_charge",
              "security_deposit",
            ].includes(key)
              ? "any"
              : void 0
          }
          {...options}
        />
      </Field>
    );
  }
  function select(key: keyof Draft, label: string, values: string[]) {
    return (
      <Field label={label}>
        <select value={draft[key]} onChange={(event) => set(key, event.target.value)}>
          {values.map((value) => (
            <option value={value} key={value}>
              {readable(value)}
            </option>
          ))}
        </select>
      </Field>
    );
  }
  async function saveDraft() {
    if (!app.token) throw new Error("Sign in to post a property.");
    if (photos.length < 2) throw new Error("Add at least 2 photos before saving your listing.");
    if (!owned) throw new Error("Only the owner can edit this property.");
    if (draft.title.trim().length < 3) throw new Error("Add a title with at least 3 characters.");
    const latest = savedId
      ? await productRequest<PropertyDetail>(`/properties/${savedId}`, app.token)
      : current;
    if (savedId && !latest?.id)
      throw new Error("Could not refresh this listing before saving. Please try again.");
    const payload = buildPropertyPayload(
      draft,
      photos,
      video,
      amenities,
      features,
      documents,
      latest,
    );
    const result = await productRequest<PropertyDetail>(
      savedId ? `/properties/${savedId}` : "/properties",
      app.token,
      savedId ? "PATCH" : "POST",
      payload,
    );
    setSavedId(result.id);
    setSaved(true);
    const snapshot = {
      ...(latest || {}),
      ...result,
    };
    setBillingSnapshot(snapshot);
    return snapshot;
  }
  async function publish() {
    if (photos.length < 2) throw new Error("Add at least 2 photos before publishing.");
    if (!draft.city.trim() || !draft.address.trim())
      throw new Error("Add an address and city before publishing.");
    if (!free && due === null) throw new Error("Listing prices have not loaded. Please retry.");
    const savedProperty = await saveDraft();
    const savedSnapshot = {
      ...(current || {}),
      ...savedProperty,
    };
    const unchangedPlan = listingPayment(null, badge, term, savedSnapshot, false, Boolean(id));
    if (unchangedPlan.live && unchangedPlan.due === 0) {
      app.changed();
      app.notify("Property updated. Your listing expiry is unchanged.");
      app.go("my-properties");
      return;
    }
    const [latestSettings, latestOffer] = await Promise.all([
      productRequest<ListingSettings>("/listing-settings"),
      productRequest<{ available: boolean }>("/me/free-listing", app.token),
    ]);
    const freshCurrent = {
      ...(current || {}),
      ...savedProperty,
    };
    const quote = listingPayment(
      latestSettings,
      badge,
      term,
      freshCurrent,
      latestOffer.available,
      Boolean(id),
    );
    if (quote.due !== due || quote.useFree !== free) {
      settings.reload();
      eligible.reload();
      wallet.reload();
      throw new Error(
        "Listing pricing or free-listing eligibility changed. Review the updated charge before continuing.",
      );
    }
    if (quote.useFree)
      await productRequest(`/properties/${savedProperty.id}/publish-free`, app.token, "POST");
    else if (quote.due !== null && quote.due > 0) {
      let balance = Number(
        (await productRequest<{ balance: number }>("/wallet", app.token)).balance,
      );
      if (balance < quote.due) {
        balance = (await funding.topUp(Math.max(1, Math.ceil(quote.due - balance)))).balance;
        wallet.reload();
        if (balance < quote.due)
          throw new Error(
            `Your previous payment is verified. Add ${formatAmount(quote.due - balance)} to finish publishing.`,
          );
      }
      await productRequest("/wallet/spend", app.token, "POST", {
        property_id: savedProperty.id,
        listing_badge: quote.badge,
        term: quote.term,
      });
    }
    app.changed();
    app.notify(
      payment.live && due === 0
        ? "Property updated. Your listing expiry is unchanged."
        : "Your property is published.",
    );
    app.go("my-properties");
  }
  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === finalStep) {
      runAuthenticated(publish);
      return;
    }
    if (step === (mobile ? 4 : 3) && photos.length < 2) {
      action.setError("Add at least 2 photos. Then you can save a draft and finish later.");
      return;
    }
    if (mobile && step === 3 && draft.title.trim().length < 3) {
      action.setError("Enter a title with at least 3 characters.");
      return;
    }
    action.setError("");
    setStep((value) => value + 1);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
  const listingFields = (
    <>
      <Field label="I want to">
        <div className="xp-choice-grid xp-listing-intent" role="group" aria-label="Listing type">
          {listingIntents.map(({ value, label, description, icon: Icon }) => (
            <button
              type="button"
              aria-pressed={draft.listing_type === value}
              aria-label={label}
              className={draft.listing_type === value ? "selected" : ""}
              onClick={() => set("listing_type", value)}
              key={value}
            >
              {!mobile && (
                <span className="xp-intent-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
              )}
              <span className="xp-intent-copy">
                <span className="xp-intent-title">{label}</span>
                <small>
                  {mobile
                    ? value === "sale"
                      ? "I want to sell this property"
                      : value === "pg"
                        ? "I want to rent as PG / Co-living"
                        : `I want to ${value} this property`
                    : description}
                </small>
              </span>
              {!mobile && (
                <span className="xp-intent-indicator" aria-hidden="true">
                  {draft.listing_type === value && <Check size={11} strokeWidth={3} />}
                </span>
              )}
            </button>
          ))}
        </div>
      </Field>
    </>
  );
  const categoryFields = (
    <>
      <RemoteState {...categories}>
        <Field label="Property category">
          <select
            value={draft.category_slug}
            required={true}
            disabled={Boolean(id)}
            onChange={(event) => set("category_slug", event.target.value)}
          >
            {categories.data?.map((category) => (
              <option value={category.slug} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        {id && <p className="xp-help">{"The category is fixed for an existing listing."}</p>}
      </RemoteState>
    </>
  );
  const posterFields = (
    <>
      <div className="xp-extract">
        <Sparkles size={22} />
        <div>
          <strong>{"Have a property poster?"}</strong>
          <p>{"Upload it to fill available details automatically. Review them before saving."}</p>
          <label className="xp-upload-label">
            {mobile ? "Fill details from photo" : "Read a poster"}
            <input
              type="file"
              accept="image/*"
              disabled={action.busy || !app.token}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file)
                  action.run(async () => {
                    const form = new FormData();
                    form.append("file", file);
                    const result = await productRequest<{ draft: Partial<Draft> }>(
                      "/properties/extract-from-image",
                      app.token,
                      "POST",
                      form,
                    );
                    setDraft((previous) => ({
                      ...previous,
                      ...Object.fromEntries(
                        Object.entries(result.draft)
                          .filter(([key, value]) => key in initial && value != null)
                          .map(([key, value]) => [key, String(value)]),
                      ),
                    }));
                    app.notify("Poster details filled. Review each field before publishing.");
                  });
              }}
            />
          </label>
        </div>
      </div>
    </>
  );
  const desktopDetails = (
    <>
      {text("title", "Property title", {
        required: true,
        maxLength: 160,
      })}
      <Field label="Description">
        <textarea
          value={draft.description}
          onChange={(event) => set("description", event.target.value)}
          maxLength={8e3}
          rows={5}
          placeholder="What makes this property special?"
        />
      </Field>
      <div className="xp-form-grid">
        {text("price", "Price (₹)", {
          type: "number",
          min: 0,
        })}
        {select("price_unit", "Price unit", ["total", "per_sqft"])}
        {text("area", "Area", {
          type: "number",
          min: 0,
        })}
        {select("area_unit", "Area unit", [
          "sq_ft",
          "sq_yd",
          "sq_m",
          "acre",
          "hectare",
          "guntha",
          "bigha",
        ])}
        {text("bedrooms", "Bedrooms", {
          type: "number",
          min: 0,
        })}
        {text("bathrooms", "Bathrooms", {
          type: "number",
          min: 0,
        })}
        {text("balconies", "Balconies", {
          type: "number",
          min: 0,
        })}
        {text("construction_year", "Construction year", {
          type: "number",
          min: 1800,
          max: 2200,
        })}
        {select("furnishing_status", "Furnishing", ["unfurnished", "semi_furnished", "furnished"])}
        {select("possession_status", "Possession", ["Ready to move", "Under construction"])}
        {text("maintenance_charge", "Maintenance (₹)", {
          type: "number",
          min: 0,
        })}
        {text("security_deposit", "Security deposit (₹)", {
          type: "number",
          min: 0,
        })}
        {select("facing", "Facing", [
          "",
          "North",
          "South",
          "East",
          "West",
          "North East",
          "North West",
          "South East",
          "South West",
        ])}
      </div>
      <label className="xp-check">
        <input
          type="checkbox"
          checked={draft.is_price_negotiable === "true"}
          onChange={(e) => set("is_price_negotiable", String(e.target.checked))}
        />
        {"Price is negotiable"}
      </label>
      <Field label="Amenities">
        <RemoteState {...amenitiesList}>
          <div className="xp-check-grid">
            {amenitiesList.data?.map((item) => (
              <label className="xp-check" key={item.id}>
                <input
                  type="checkbox"
                  checked={amenities.includes(item.id)}
                  onChange={(event) =>
                    setAmenities((previous) =>
                      event.target.checked
                        ? [...previous, item.id]
                        : previous.filter((value) => value !== item.id),
                    )
                  }
                />
                {item.name}
              </label>
            ))}
          </div>
        </RemoteState>
      </Field>
      <Field label="Features">
        <div className="xp-check-grid">
          {["Corner Plot", "Road Facing", "Main Road", "Gated Society"].map((feature) => (
            <label className="xp-check" key={feature}>
              <input
                type="checkbox"
                checked={features.includes(feature)}
                onChange={(event) =>
                  setFeatures((previous) =>
                    event.target.checked
                      ? [...previous, feature]
                      : previous.filter((value) => value !== feature),
                  )
                }
              />
              {feature}
            </label>
          ))}
        </div>
      </Field>
    </>
  );
  async function fillCurrentLocation() {
    if (!navigator.geolocation) throw new Error("Location is not supported by this browser.");
    const position = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) =>
          reject(
            new Error(
              error.code === 1
                ? "Please allow location access in your browser and try again."
                : "Could not read your location. Please try again.",
            ),
          ),
        { timeout: 15000, maximumAge: 60000, enableHighAccuracy: true },
      ),
    );
    const { latitude, longitude } = position.coords;
    setDraft((previous) => ({
      ...previous,
      latitude: String(latitude),
      longitude: String(longitude),
    }));
    const place = await reverseGeocode(latitude, longitude);
    setDraft((previous) => ({
      ...previous,
      address: place.address || previous.address,
      city: place.city || previous.city,
      locality: place.locality || previous.locality,
      district: place.district || previous.district,
      state: place.state || previous.state,
      pincode: place.pincode || previous.pincode,
    }));
    app.notify("Location details filled. Please review the address before continuing.");
  }
  const locbutton = (
    <div className="xp-current-location">
      <button
        className="xp-button secondary"
        type="button"
        disabled={action.busy}
        onClick={() => void action.run(fillCurrentLocation)}
      >
        <MapPin size={17} />
        {action.busy ? "Finding your location…" : "Use my current location"}
      </button>
      <small>
        Address data ©{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>
      </small>
    </div>
  );
  const locationFields = (
    <>
      {text("address", "Address", {
        required: true,
        maxLength: 300,
      })}
      <div className="xp-form-grid">
        {text("locality", "Locality", {
          maxLength: 120,
        })}
        {text("city", "City", {
          required: true,
          maxLength: 120,
        })}
        {text("district", "District", {
          maxLength: 120,
        })}
        {text("state", "State", {
          maxLength: 120,
        })}
        {text("pincode", "Pincode", {
          maxLength: 12,
        })}
        {text("latitude", "Latitude", {
          type: "number",
          min: -90,
          max: 90,
        })}
        {text("longitude", "Longitude", {
          type: "number",
          min: -180,
          max: 180,
        })}
      </div>
      {locbutton}
    </>
  );
  const mediaFields = (
    <>
      <label className="xp-media-drop">
        <ImagePlus size={32} />
        <strong>{"Add property photos"}</strong>
        <span>{"At least 2 photos. The first photo is your cover."}</span>
        <input
          type="file"
          accept="image/*"
          multiple={true}
          disabled={action.busy || !app.token}
          onChange={(event) => {
            const files = Array.from(event.target.files || []);
            action.run(async () => {
              if (files.length + photos.length > 29)
                throw new Error("You can add up to 29 photos and one video.");
              for (const file of files) {
                const url = await uploadFile(file, app.token!);
                setPhotos((previous) => [...previous, url]);
              }
            });
            event.target.value = "";
          }}
        />
      </label>
      <div className="xp-uploaded-grid">
        {photos.map((url, index) => (
          <div key={url}>
            <img src={url} alt={`Property photo ${index + 1}`} />
            {index === 0 ? (
              <span>{"Cover"}</span>
            ) : (
              <button
                type="button"
                className="xp-cover"
                onClick={() =>
                  setPhotos((previous) => [url, ...previous.filter((value) => value !== url)])
                }
              >
                {"Make cover"}
              </button>
            )}
            <button
              type="button"
              disabled={action.busy}
              className="xp-remove"
              aria-label={`Remove photo ${index + 1}`}
              onClick={() => setPhotos((previous) => previous.filter((value) => value !== url))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <Field label="Property video (optional)">
        <input
          type="file"
          accept="video/*"
          disabled={action.busy || !app.token}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) action.run(async () => setVideo(await uploadFile(file, app.token!, "video")));
          }}
        />
      </Field>
      {video && (
        <div className="xp-row">
          <video className="xp-upload-video" controls={true} src={video} />
          <button type="button" className="xp-text-button" onClick={() => setVideo("")}>
            {"Remove video"}
          </button>
        </div>
      )}
    </>
  );
  const documentFields = (
    <>
      <Field label="Supporting documents (optional)">
        <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
          {[
            "sale_deed",
            "7_12",
            "property_card",
            "na_order",
            "tax_receipt",
            "rera_certificate",
            "ownership_proof",
            "building_permission",
            "other",
          ].map((value) => (
            <option value={value} key={value}>
              {readable(value)}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          disabled={action.busy || !app.token}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file)
              action.run(async () => {
                const url = await uploadFile(file, app.token!, "document");
                setDocuments((previous) => ({
                  ...previous,
                  [documentType]: url,
                }));
              });
          }}
        />
      </Field>
      {Object.entries(documents).map(([type, url]) => (
        <div className="xp-row" key={type}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {readable(type)}
          </a>
          <button
            type="button"
            className="xp-text-button"
            onClick={() =>
              setDocuments((previous) =>
                Object.fromEntries(Object.entries(previous).filter(([key]) => key !== type)),
              )
            }
          >
            {"Remove"}
          </button>
        </div>
      ))}
    </>
  );
  const planFields = (
    <>
      <RemoteState
        loading={settings.loading || eligible.loading}
        error={settings.error || eligible.error}
        retry={() => {
          settings.reload();
          eligible.reload();
        }}
      >
        <Field label="Listing plan">
          <div className="xp-choice-grid">
            {["standard", "premium"].map((value) => (
              <button
                type="button"
                disabled={Boolean(id)}
                className={payment.badge === value ? "selected" : ""}
                aria-pressed={payment.badge === value}
                onClick={() => setBadge(value as "standard" | "premium")}
                key={value}
              >
                <strong>{value === "premium" ? "Premium" : "Regular"}</strong>
                <span>
                  {settings.data
                    ? displayPrice(
                        value === "premium"
                          ? settings.data.premiumPrice
                          : settings.data.standardPrice,
                      )
                    : "—"}{" "}
                  {"/ month"}
                </span>
                <small>
                  {value === "premium"
                    ? "Featured in premium properties"
                    : "Appear in property searches"}
                </small>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Listing duration">
          <select
            disabled={Boolean(id)}
            value={payment.term}
            onChange={(event) => setTerm(event.target.value as "month" | "year")}
          >
            <option value="month">{"Monthly"}</option>
            <option value="year">
              {"Yearly · "}
              {settings.data?.yearlyDiscountPercent || 0}
              {"% saving"}
            </option>
          </select>
        </Field>
      </RemoteState>
      {id && (
        <p className="xp-help">
          {"This property keeps its existing"} {payment.badge === "premium" ? "premium" : "regular"}{" "}
          {payment.term === "year" ? "yearly" : "monthly"}
          {" plan."}
        </p>
      )}
      {free && (
        <p className="xp-free-option xp-success">
          <Check size={17} />
          {"Your first regular monthly listing includes a free 15-day trial."}
        </p>
      )}
      {payment.live && due === 0 && (
        <p className="xp-help">
          {"Saving changes keeps the current expiry date. There is no additional listing charge."}
        </p>
      )}
    </>
  );
  const reviewFields = (
    <>
      <div className="xp-listing-review">
        {photos[0] && <img src={photos[0]} alt="Property cover" />}
        <div>
          <h3>{draft.title}</h3>
          <p>
            {draft.city}
            {" · "}
            {draft.listing_type}
          </p>
          <strong>{displayPrice(draft.price)}</strong>
          <small>
            {photos.length}
            {" photos"}
          </small>
        </div>
      </div>
      {planFields}
      <div className="xp-price-summary">
        <div>
          <span>{"Listing charge"}</span>
          <strong>{free ? "Free" : due !== null ? formatAmount(due) : "Prices unavailable"}</strong>
        </div>
        <div>
          <span>{"Wallet balance"}</span>
          <strong>
            {wallet.loading
              ? "Loading…"
              : wallet.error
                ? "Unavailable"
                : wallet.data
                  ? formatAmount(wallet.data.balance)
                  : "—"}
          </strong>
        </div>
      </div>
      {funding.pending && (
        <p className="xp-notice" role="status">
          {
            "Your payment needs verification. Continue to retry verification and finish publishing; a second payment will not be started."
          }
        </p>
      )}
      {!free && due !== null && wallet.data && wallet.data.balance < due && (
        <p className="xp-notice">
          {"Your wallet needs "}
          {formatAmount(due - wallet.data.balance)}
          {
            " more. Continue to add the difference securely, then publish without leaving this form."
          }
        </p>
      )}
      <p className="xp-help">
        {
          "Monthly plans run for one month. Yearly plans apply the current yearly discount. Renewal is due after the listing expires."
        }
      </p>
      <p className="xp-help">
        {
          "By publishing, you confirm that the listing details and photos are accurate and that you have permission to list this property."
        }
      </p>
    </>
  );
  const amenityFields = (
    <>
      <Field label="Amenities">
        <RemoteState {...amenitiesList}>
          <div className="xp-check-grid">
            {amenitiesList.data?.map((item) => (
              <label className="xp-check" key={item.id}>
                <input
                  type="checkbox"
                  checked={amenities.includes(item.id)}
                  onChange={(event) =>
                    setAmenities((previous) =>
                      event.target.checked
                        ? [...previous, item.id]
                        : previous.filter((value) => value !== item.id),
                    )
                  }
                />
                {item.name}
              </label>
            ))}
          </div>
        </RemoteState>
      </Field>
      <Field label="Features">
        <div className="xp-check-grid">
          {["Corner Plot", "Road Facing", "Main Road", "Gated Society"].map((feature) => (
            <label className="xp-check" key={feature}>
              <input
                type="checkbox"
                checked={features.includes(feature)}
                onChange={(event) =>
                  setFeatures((previous) =>
                    event.target.checked
                      ? [...previous, feature]
                      : previous.filter((value) => value !== feature),
                  )
                }
              />
              {feature}
            </label>
          ))}
        </div>
      </Field>
    </>
  );
  return (
    <div className="xp-page xp-create-page">
      <MobilePageHeader
        title={id ? "Edit Property" : "Create Property"}
        onBack={() => {
          if (step > 0) setStep((value) => value - 1);
          else app.go("home");
          action.setError("");
        }}
        right={
          <button
            type="button"
            className="xp-native-back"
            aria-label="Close listing"
            onClick={() => app.go("home")}
          >
            <X size={24} />
          </button>
        }
      />
      <PageHeading
        title={id ? "Edit your property" : "Give your property a new beginning"}
        description="A few details can help the right people find your place."
        action={
          <ExploreLink view="my-properties" className="xp-text-button">
            {"My properties"}
            <ArrowRight size={15} />
          </ExploreLink>
        }
      />
      {!app.token && (
        <div className="xp-notice xp-guest-create">
          <div>
            <strong>{"Start your property listing"}</strong>
            <p>
              {"You can fill in the details now. Sign in here to upload photos, save, and publish."}
            </p>
          </div>
          <button className="xp-button" onClick={() => setLoginOpen(true)}>
            {"Sign in to continue"}
          </button>
        </div>
      )}
      <RemoteState loading={existing.loading} error={existing.error} retry={existing.reload}>
        {!owned ? (
          <div className="xp-error">{"You can only edit properties you own."}</div>
        ) : (
          <div className="xp-create-layout">
            <aside className="xp-create-steps">
              <span className="xp-kicker">{"MAKE IT STAND OUT"}</span>
              <h2>
                {"A great listing"}
                <br />
                {"starts with you."}
              </h2>
              {steps.map((title, index) => (
                <div
                  className={index === step ? "active" : index < step ? "complete" : ""}
                  key={title}
                >
                  <span>{index < step ? <Check size={16} /> : index + 1}</span>
                  <strong>{title}</strong>
                </div>
              ))}
              <div className="xp-create-tip">
                <ImagePlus size={25} />
                <p>
                  {"Bright photos and a clear description help buyers picture their next chapter."}
                </p>
              </div>
            </aside>
            <section className="xp-panel xp-create-form">
              <div className="xp-step-counter">
                <span>
                  {mobile ? `${step + 1}/${steps.length}` : `STEP ${step + 1} OF ${steps.length}`}
                </span>
                {mobile && (
                  <progress aria-label="Listing progress" value={step + 1} max={steps.length} />
                )}
              </div>
              <h2>{steps[step]}</h2>
              <form onSubmit={next}>
                {step === 0 &&
                  (mobile ? (
                    <>
                      {posterFields}
                      <h2 className="xp-kind-heading">What kind of property?</h2>
                      <RemoteState {...categories}>
                        <div className="xp-kind-grid">
                          {categories.data?.map((category) => (
                            <button
                              type="button"
                              key={category.id}
                              aria-pressed={draft.category_slug === category.slug}
                              disabled={Boolean(id)}
                              onClick={() => set("category_slug", category.slug)}
                            >
                              <img
                                src={`/images/app-property-${["house", "villa", "warehouse"].includes(category.slug) ? "house" : ["apartment", "agricultural-land", "office"].includes(category.slug) ? "hero" : "land"}.jpg`}
                                alt=""
                              />
                              <span>
                                {category.slug === "residential-plot" ? "Plot" : category.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </RemoteState>
                      {id && (
                        <p className="xp-help">The category is fixed for an existing listing.</p>
                      )}
                    </>
                  ) : (
                    <>
                      {listingFields}
                      {categoryFields}
                      {posterFields}
                    </>
                  ))}
                {!mobile && step === 1 && desktopDetails}
                {step === 2 &&
                  (mobile ? (
                    <>
                      {locbutton}
                      {text("address", "Address", { required: true, maxLength: 300 })}
                      {text("city", "City", { required: true, maxLength: 120 })}
                      {text("locality", "Area / locality", { maxLength: 120 })}
                      {text("pincode", "Pincode", { maxLength: 12 })}
                      <div className="xp-location-preview">
                        <MapPin size={28} />
                        <span>
                          {draft.latitude && draft.longitude
                            ? `${Number(draft.latitude).toFixed(4)}, ${Number(draft.longitude).toFixed(4)}`
                            : "Property location"}
                        </span>
                      </div>
                    </>
                  ) : (
                    locationFields
                  ))}
                {mobile && step === 1 && <div className="xp-listing-types">{listingFields}</div>}
                {mobile && step === 3 && (
                  <>
                    {text("title", "Property title", { required: true, maxLength: 160 })}
                    <Field label="Description">
                      <textarea
                        value={draft.description}
                        onChange={(event) => set("description", event.target.value)}
                        maxLength={8000}
                        rows={4}
                        placeholder="Describe your property"
                      />
                    </Field>
                    <div className="xp-native-three">
                      {text("bedrooms", "Bedrooms", { type: "number", min: 0 })}
                      {text("bathrooms", "Bathrooms", { type: "number", min: 0 })}
                      {text("balconies", "Balconies", { type: "number", min: 0 })}
                    </div>
                    <div className="xp-form-grid">
                      {text("area", "Built-up area (sq ft)", { type: "number", min: 0 })}
                      {select("furnishing_status", "Furnishing", [
                        "unfurnished",
                        "semi_furnished",
                        "furnished",
                      ])}
                      {text("construction_year", "Construction year", {
                        type: "number",
                        min: 1800,
                        max: 2200,
                      })}
                      {select("possession_status", "Possession", [
                        "Ready to move",
                        "Under construction",
                      ])}
                    </div>
                  </>
                )}
                {(mobile ? step === 4 : step === 3) && (
                  <>
                    {mediaFields}
                    {!mobile && documentFields}
                  </>
                )}
                {mobile && step === 5 && (
                  <>
                    {text("price", "Price (₹)", { type: "number", min: 0 })}
                    <Field label="Price unit">
                      <div className="xp-native-segments">
                        {["total", "per_sqft"].map((value) => (
                          <button
                            type="button"
                            key={value}
                            aria-pressed={draft.price_unit === value}
                            onClick={() => set("price_unit", value)}
                          >
                            {value === "total" ? "Total price" : "Per sq ft"}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <label className="xp-check">
                      <input
                        type="checkbox"
                        checked={draft.is_price_negotiable === "true"}
                        onChange={(event) =>
                          set("is_price_negotiable", String(event.target.checked))
                        }
                      />
                      Price is negotiable
                    </label>
                    {text("maintenance_charge", "Maintenance (₹)", { type: "number", min: 0 })}
                    {text("security_deposit", "Security deposit (₹)", { type: "number", min: 0 })}
                    {planFields}
                  </>
                )}
                {mobile && step === 6 && <>{amenityFields}</>}
                {step === finalStep && (
                  <>
                    {mobile ? (
                      <div className="xp-native-documents">
                        {[
                          ["sale_deed", "Sale Deed"],
                          ["7_12", "7/12 Extract"],
                          ["property_card", "Property Card"],
                          ["tax_receipt", "Tax Receipt"],
                          ["rera_certificate", "RERA Certificate"],
                          ["other", "Other Document"],
                        ].map(([type, label]) => (
                          <label className="xp-native-document" key={type}>
                            <span>
                              <FileText size={18} />
                            </span>
                            <strong>
                              {label}
                              {documents[type!] ? " · Added" : ""}
                            </strong>
                            <CloudUpload size={20} />
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              aria-label={`Upload ${label}`}
                              disabled={action.busy || !app.token}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file)
                                  runAuthenticated(async () => {
                                    const url = await uploadFile(file, app.token!, "document");
                                    setDocuments((previous) => ({ ...previous, [type!]: url }));
                                  });
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <>{reviewFields}</>
                    )}
                  </>
                )}
                <ActionError error={action.error} />
                {saved && (
                  <p className="xp-success" role="status">
                    <Check size={16} />
                    {"Draft saved. You can return from My properties."}
                  </p>
                )}
                <div className="xp-form-actions">
                  <button
                    type="button"
                    className="xp-button secondary"
                    disabled={(!mobile && step === 0) || action.busy}
                    onClick={() => {
                      if (step === 0) app.go("home");
                      else setStep((value) => value - 1);
                      action.setError("");
                    }}
                  >
                    <ArrowLeft size={16} />
                    {mobile && step === 0 ? "Cancel" : "Back"}
                  </button>
                  <button
                    type="button"
                    className="xp-text-button"
                    disabled={action.busy}
                    onClick={() =>
                      runAuthenticated(async () => {
                        await saveDraft();
                        app.changed();
                        app.notify("Draft saved.");
                      })
                    }
                  >
                    {"Save draft"}
                  </button>
                  <button
                    className="xp-button"
                    disabled={
                      action.busy ||
                      (step === 0 && (categories.loading || Boolean(categories.error))) ||
                      (step === finalStep && !free && due === null)
                    }
                  >
                    {action.busy ? (
                      <Fragment>
                        <AnimatedLoader size="small" color="currentColor" />
                        {"Please wait…"}
                      </Fragment>
                    ) : step === finalStep ? (
                      free ? (
                        "Publish free"
                      ) : funding.pending ? (
                        "Verify payment & publish"
                      ) : due === 0 && payment.live ? (
                        "Save changes"
                      ) : due !== null && wallet.data && wallet.data.balance < due ? (
                        `Pay ${formatAmount(Math.ceil(due - wallet.data.balance))} & publish`
                      ) : (
                        "Publish property"
                      )
                    ) : mobile ? (
                      "Next"
                    ) : (
                      "Continue"
                    )}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </RemoteState>
      <Dialog.Root open={loginOpen} onOpenChange={setLoginOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="xp-modal-overlay" />
          <Dialog.Content className="xp-modal xp-listing-login" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">Sign in to continue your listing</Dialog.Title>
            <Dialog.Close className="xp-login-close" aria-label="Close sign in">
              <X size={20} />
            </Dialog.Close>
            <LoginPage
              onSuccess={() => {
                setLoginOpen(false);
                action.setError("");
                app.notify("Signed in. Your property details are still here.");
              }}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
