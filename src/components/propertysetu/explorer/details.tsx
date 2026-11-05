import { MobilePageHeader } from "./mobile";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
} from "lucide-react";
import { displayPrice } from "@/lib/propertysetu";
import { dateTime, productRequest, readable } from "@/lib/explorer";
import type { ChatThread, PropertyDetail } from "@/lib/explorer-types";
import { useAction, useProduct, useResource } from "./context";
import { ActionError, ExploreLink, Field, PageHeading, RemoteState, ConfirmAction } from "./ui";

export function DetailsPage({ id }: { id: string }) {
  const app = useProduct();
  const resource = useResource<PropertyDetail>(
    `/properties/${encodeURIComponent(id)}`,
    app.token,
    app.refresh,
  );
  const row = resource.data;
  const action = useAction();
  const [panel, setPanel] = useState<"inquiry" | "visit" | "report" | null>(null);
  const [photo, setPhoto] = useState(0);
  const [tab, setTab] = useState("overview");
  const recorded = useRef("");
  useEffect(() => {
    if (!row?.id || recorded.current === row.id) return;
    recorded.current = row.id;
    void productRequest(`/properties/${row.id}/view`, app.token, "POST", {
      device_type: "web",
    }).catch(() => undefined);
  }, [row?.id, app.token]);
  const closed = row && ["sold", "rented", "expired", "archived"].includes(row.status);
  const own = row?.owner_id === app.session?.user.id;
  const images = row?.images?.filter((image) => image.image_type !== "video") || [];
  const video = row?.images?.find((image) => image.image_type === "video");
  const photos = images.length
    ? images.map((image) => image.image_url)
    : row?.cover_image
      ? [row.cover_image]
      : [];
  const lat = Number(row?.latitude);
  const lng = Number(row?.longitude);
  const coordinates = Boolean(
    row?.latitude && row?.longitude && Number.isFinite(lat) && Number.isFinite(lng),
  );
  async function contact(kind: "call" | "whatsapp") {
    if (!app.requireLogin() || !row) return;
    if (!row.owner_phone)
      throw new Error("The owner hasn’t provided a phone number. You can send an inquiry instead.");
    await productRequest(`/properties/${row.id}/inquiries`, app.token, "POST", {
      inquiry_type: kind,
    });
    const digits = row.owner_phone.replace(/\D/g, "");
    window.location.href =
      kind === "call"
        ? `tel:${row.owner_phone}`
        : `https://wa.me/${digits.length === 10 ? "91" + digits : digits}`;
  }
  return (
    <div className="xp-page">
      {resource.errorStatus === 404 && !resource.loading ? (
        <div className="home-empty" role="alert">
          <MapPin />
          <h2>Property unavailable</h2>
          <p>This listing may have been removed or is no longer available to your account.</p>
          <ExploreLink view="home" className="xp-button">
            Browse properties
          </ExploreLink>
          <button className="xp-button secondary" onClick={resource.retry}>
            Try again
          </button>
        </div>
      ) : (
        <RemoteState {...resource}>
          {row && (
            <>
              <MobilePageHeader title={row.title} />
              <PageHeading
                title={row.title}
                description={[row.locality, row.city].filter(Boolean).join(", ")}
                action={
                  <button
                    className="xp-button secondary"
                    onClick={() =>
                      void action.run(async () => {
                        const url = window.location.href;
                        if (navigator.share) await navigator.share({ title: row.title, url });
                        else {
                          await navigator.clipboard.writeText(url);
                          app.notify("Property link copied.");
                        }
                      })
                    }
                  >
                    <Share2 size={17} />
                    Share
                  </button>
                }
              />
              <div className="xp-detail-layout">
                <div>
                  <div className="xp-gallery">
                    {photos.length ? (
                      <img
                        src={photos[Math.min(photo, photos.length - 1)]}
                        alt={`${row.title}, photo ${photo + 1}`}
                      />
                    ) : (
                      <div className="home-empty">
                        <MapPin />
                        <p>No photos available.</p>
                      </div>
                    )}
                    {row.is_premium && (
                      <span className="property-premium xp-gallery-badge">Premium property</span>
                    )}
                  </div>
                  {photos.length > 1 && (
                    <div className="xp-thumbnails">
                      {photos.map((url, index) => (
                        <button
                          key={url + index}
                          className={photo === index ? "active" : ""}
                          onClick={() => setPhoto(index)}
                          aria-label={`View photo ${index + 1}`}
                        >
                          <img src={url} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="xp-mobile-detail-summary">
                    <h1>{row.title}</h1>
                    {!own && (
                      <button
                        className="xp-mobile-save"
                        aria-label={row.is_favorite ? "Unsave property" : "Save property"}
                        aria-pressed={Boolean(row.is_favorite)}
                        disabled={action.busy || Boolean(closed)}
                        onClick={() =>
                          void action.run(async () => {
                            if (!app.requireLogin()) return;
                            await productRequest(
                              `/properties/${row.id}/favorite`,
                              app.token,
                              row.is_favorite ? "DELETE" : "POST",
                            );
                            app.changed();
                          })
                        }
                      >
                        <Heart size={20} fill={row.is_favorite ? "currentColor" : "none"} />
                      </button>
                    )}
                    <p>
                      <MapPin size={15} />
                      {[row.locality, row.city].filter(Boolean).join(", ")}
                    </p>
                    <strong>{displayPrice(row.price)}</strong>
                    <div className="xp-mobile-facts">
                      {[
                        ["Bedrooms", row.bedrooms],
                        ["Bathrooms", row.bathrooms],
                        ["Parking", row.parking_spaces],
                        [readable(row.area_unit || "sq_ft"), row.area],
                      ].map(([label, value]) => (
                        <div key={String(label)}>
                          <strong>{value ?? "—"}</strong>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <nav className="xp-detail-tabs" aria-label="Property information">
                    {["overview", "amenities", "location", "documents"].map((value) => (
                      <button
                        key={value}
                        aria-pressed={tab === value}
                        onClick={() => setTab(value)}
                      >
                        {readable(value)}
                      </button>
                    ))}
                  </nav>
                  <section className={`xp-panel xp-detail-overview xp-detail-tab-${tab}`}>
                    <div className="xp-detail-tags">
                      <span>
                        {row.listing_type === "sale" ? "For sale" : `For ${row.listing_type}`}
                      </span>
                      <span>{row.category_name || row.property_type}</span>
                      {row.is_price_negotiable && <span>Negotiable</span>}
                    </div>
                    <h2>A closer look</h2>
                    <div className="xp-facts">
                      {[
                        ["Bedrooms", row.bedrooms],
                        ["Bathrooms", row.bathrooms],
                        ["Area", row.area ? `${row.area} ${readable(row.area_unit)}` : null],
                        ["Furnishing", readable(row.furnishing_status)],
                        ["Possession", row.possession_status],
                        ["Construction year", row.construction_year],
                        ["Facing", row.facing],
                      ]
                        .filter(([, value]) => Boolean(value))
                        .map(([label, value]) => (
                          <div key={String(label)}>
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                    </div>
                    <h3 className="xp-overview-copy">About this property</h3>
                    <p className="xp-description xp-overview-copy">
                      {row.description || "The owner hasn’t added a description yet."}
                    </p>
                    {row.amenities?.length ? (
                      <>
                        <h3 className="xp-amenities-copy">Amenities</h3>
                        <div className="xp-chips xp-amenities-copy">
                          {row.amenities.map((item) => (
                            <span key={item.id}>{item.name}</span>
                          ))}
                        </div>
                      </>
                    ) : null}
                    {row.features?.filter(
                      (item) => !["listing_badge", "listing_term"].includes(item.feature_key),
                    ).length ? (
                      <>
                        <h3>Features</h3>
                        <div className="xp-chips">
                          {row.features
                            .filter(
                              (item) =>
                                !["listing_badge", "listing_term"].includes(item.feature_key),
                            )
                            .map((item) => (
                              <span key={item.id}>
                                {readable(item.feature_key)}
                                {item.feature_value ? `: ${item.feature_value}` : ""}
                              </span>
                            ))}
                        </div>
                      </>
                    ) : null}
                  </section>
                  {video && (
                    <section className="xp-panel">
                      <h2>Property video</h2>
                      <video
                        controls
                        preload="metadata"
                        src={video.image_url}
                        className="xp-video"
                      />
                    </section>
                  )}
                  <section
                    className={`xp-panel xp-detail-location ${tab === "location" ? "is-active" : ""}`}
                  >
                    <h2>Location</h2>
                    <p>
                      {[row.address, row.locality, row.city, row.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {coordinates ? (
                      <>
                        <iframe
                          title="Property location"
                          className="xp-map"
                          loading="lazy"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012},${lat - 0.008},${lng + 0.012},${lat + 0.008}&layer=mapnik&marker=${lat},${lng}`}
                        />
                        <a
                          className="xp-text-button"
                          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Get directions
                          <ArrowUpRight size={15} />
                        </a>
                      </>
                    ) : (
                      <p className="xp-help">The owner hasn’t provided a map location.</p>
                    )}
                  </section>
                  <div className={`xp-detail-documents ${tab === "documents" ? "is-active" : ""}`}>
                    {!own && !closed && (
                      <button
                        className="xp-text-button"
                        onClick={() => {
                          if (app.requireLogin()) setPanel("visit");
                        }}
                      >
                        Schedule a visit
                      </button>
                    )}
                  </div>
                </div>
                <aside className="xp-detail-aside">
                  <section className="xp-panel">
                    <span className="xp-kicker">YOUR NEXT ADDRESS</span>
                    <h2 className="xp-detail-price">
                      {displayPrice(row.price)}
                      {row.listing_type === "rent" && row.price ? <small> / month</small> : null}
                    </h2>
                    <p className="xp-help">
                      {row.price_unit === "per_sqft"
                        ? "Price per square foot"
                        : row.is_price_negotiable
                          ? "Price is negotiable"
                          : "Connect with the owner for more details"}
                    </p>
                    <div className="xp-owner">
                      <span className="xp-avatar">
                        <img src={row.owner_avatar || "/images/logo-emblem.png"} alt="" />
                      </span>
                      <div>
                        <strong>{row.owner_name || "Property owner"}</strong>
                        <small>{row.owner_verified ? "Verified owner" : "Property owner"}</small>
                      </div>
                    </div>
                    {own ? (
                      <>
                        <ExploreLink view="create" id={row.id} className="xp-button full">
                          Edit property
                        </ExploreLink>
                        <ExploreLink view="my-properties" className="xp-button secondary full">
                          Manage my properties
                        </ExploreLink>
                      </>
                    ) : closed ? (
                      <p className="xp-notice">This property is no longer available.</p>
                    ) : (
                      <>
                        <button
                          className="xp-button full"
                          disabled={action.busy || Boolean(closed)}
                          onClick={() => {
                            if (app.requireLogin()) setPanel("inquiry");
                          }}
                        >
                          <MessageCircle size={18} />
                          Send inquiry
                        </button>
                        <button
                          className="xp-button secondary full"
                          disabled={action.busy || Boolean(closed)}
                          onClick={() =>
                            void action.run(async () => {
                              if (!app.requireLogin()) return;
                              const chat = await productRequest<ChatThread>(
                                `/properties/${row.id}/chat`,
                                app.token,
                                "POST",
                                {},
                              );
                              app.go("chat", chat.id);
                            })
                          }
                        >
                          <MessageCircle size={18} />
                          Chat with owner
                        </button>
                        <button
                          className="xp-button secondary full"
                          onClick={() => {
                            if (app.requireLogin()) setPanel("visit");
                          }}
                        >
                          <CalendarDays size={18} />
                          Schedule a visit
                        </button>
                        <div className="xp-actions">
                          <button
                            className="xp-button secondary"
                            disabled={action.busy}
                            onClick={() => void action.run(() => contact("call"))}
                          >
                            <Phone size={16} />
                            Call
                          </button>
                          <button
                            className="xp-button secondary"
                            disabled={action.busy}
                            onClick={() => void action.run(() => contact("whatsapp"))}
                          >
                            WhatsApp
                          </button>
                        </div>
                      </>
                    )}
                    <button
                      className="xp-button subtle full"
                      disabled={action.busy || Boolean(closed)}
                      onClick={() =>
                        void action.run(async () => {
                          if (!app.requireLogin()) return;
                          await productRequest(
                            `/properties/${row.id}/favorite`,
                            app.token,
                            row.is_favorite ? "DELETE" : "POST",
                          );
                          app.changed();
                          app.notify(
                            row.is_favorite ? "Removed from saved properties." : "Property saved.",
                          );
                        })
                      }
                    >
                      <Heart size={17} fill={row.is_favorite ? "currentColor" : "none"} />
                      {row.is_favorite ? "Saved property" : "Save property"}
                    </button>
                    <ActionError error={action.error} />
                  </section>
                  {!own && (
                    <section className="xp-panel xp-safety">
                      <h3>A little peace of mind</h3>
                      <p>Visit the property and verify ownership before making a payment.</p>
                      <button
                        className="xp-text-button"
                        onClick={() => {
                          if (app.requireLogin()) setPanel("report");
                        }}
                      >
                        Report this property
                      </button>
                      {app.token && (
                        <ConfirmAction
                          label="Block owner"
                          title="Block this owner?"
                          description="Their properties and messages will be hidden from your account."
                          onConfirm={async () => {
                            await productRequest(`/users/${row.owner_id}/block`, app.token, "PUT");
                            app.changed();
                            app.go("home");
                          }}
                        />
                      )}
                    </section>
                  )}
                </aside>
              </div>
              <div className="xp-mobile-contact">
                {own ? (
                  <ExploreLink className="xp-button full" view="create" id={row.id}>
                    Edit property
                  </ExploreLink>
                ) : closed ? (
                  <span>This property is no longer available.</span>
                ) : (
                  <>
                    <button
                      className="xp-button xp-mobile-schedule"
                      onClick={() => {
                        if (app.requireLogin()) setPanel("visit");
                      }}
                    >
                      Schedule a visit
                    </button>
                    <button
                      className="xp-button secondary"
                      disabled={action.busy}
                      onClick={() => void action.run(() => contact("call"))}
                    >
                      <Phone size={17} />
                      Call
                    </button>
                    <button
                      className="xp-button"
                      disabled={action.busy}
                      onClick={() => void action.run(() => contact("whatsapp"))}
                    >
                      WhatsApp
                    </button>
                    <button
                      className="xp-button secondary"
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(async () => {
                          if (!app.requireLogin()) return;
                          const chat = await productRequest<ChatThread>(
                            `/properties/${row.id}/chat`,
                            app.token,
                            "POST",
                            {},
                          );
                          app.go("chat", chat.id);
                        })
                      }
                    >
                      <MessageCircle size={17} />
                      Chat
                    </button>
                  </>
                )}
              </div>
              {panel && (
                <Dialog.Root
                  open={Boolean(panel)}
                  onOpenChange={(open) => {
                    if (!open) setPanel(null);
                  }}
                >
                  <Dialog.Portal>
                    <Dialog.Overlay className="xp-modal-overlay" />
                    <Dialog.Content
                      className="xp-modal xp-contact-form"
                      aria-describedby={undefined}
                    >
                      <div className="xp-row">
                        <Dialog.Title>
                          {panel === "visit"
                            ? "Plan a property visit"
                            : panel === "report"
                              ? "Report property"
                              : "Send an inquiry"}
                        </Dialog.Title>
                        <button className="xp-text-button" onClick={() => setPanel(null)}>
                          Close
                        </button>
                      </div>
                      <form
                        key={panel}
                        onSubmit={(event) => {
                          event.preventDefault();
                          const form = new FormData(event.currentTarget);
                          void action.run(async () => {
                            if (!app.requireLogin()) return;
                            const body = Object.fromEntries(form);
                            if (panel === "visit") {
                              const scheduled = new Date(String(body["scheduled_at"]));
                              if (scheduled.getTime() <= Date.now())
                                throw new Error("Choose a future date and time.");
                              body["scheduled_at"] = scheduled.toISOString();
                            }
                            await productRequest(
                              `/properties/${row.id}/${panel === "visit" ? "visits" : panel === "report" ? "reports" : "inquiries"}`,
                              app.token,
                              "POST",
                              body,
                            );
                            app.notify(
                              panel === "report"
                                ? "Report submitted. Thank you."
                                : panel === "visit"
                                  ? "Visit requested. Track it in Visits."
                                  : "Your inquiry has been sent.",
                            );
                            setPanel(null);
                            app.changed();
                          });
                        }}
                      >
                        {panel === "visit" ? (
                          <>
                            <Field label="Date and time">
                              <input
                                type="datetime-local"
                                name="scheduled_at"
                                required
                                min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                                  .toISOString()
                                  .slice(0, 16)}
                              />
                            </Field>
                            <Field label="Notes">
                              <textarea name="notes" maxLength={1000} />
                            </Field>
                          </>
                        ) : panel === "report" ? (
                          <>
                            <Field label="Reason">
                              <select name="reason">
                                {[
                                  "fake_property",
                                  "wrong_price",
                                  "wrong_location",
                                  "duplicate",
                                  "already_sold",
                                  "fraud",
                                  "inappropriate",
                                  "other",
                                ].map((reason) => (
                                  <option key={reason} value={reason}>
                                    {readable(reason)}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Details">
                              <textarea name="description" maxLength={2000} />
                            </Field>
                          </>
                        ) : (
                          <>
                            <div className="xp-form-grid">
                              <Field label="Your name">
                                <input
                                  name="name"
                                  defaultValue={app.me?.profile?.full_name || ""}
                                  maxLength={120}
                                />
                              </Field>
                              <Field label="Phone">
                                <input
                                  name="phone"
                                  type="tel"
                                  defaultValue={app.me?.profile?.phone || ""}
                                  maxLength={20}
                                />
                              </Field>
                            </div>
                            <Field label="Message">
                              <textarea
                                name="message"
                                required
                                maxLength={2000}
                                placeholder="I’m interested in this property. Could you share more details?"
                              />
                            </Field>
                          </>
                        )}
                        <ActionError error={action.error} />
                        <button className="xp-button" disabled={action.busy || Boolean(closed)}>
                          {action.busy ? "Sending…" : "Submit"}
                        </button>
                      </form>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              )}
            </>
          )}
        </RemoteState>
      )}
    </div>
  );
}
