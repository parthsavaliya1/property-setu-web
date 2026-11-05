import { LanguageSelection, useExplorerLanguage } from "./language";
import { AnimatedLoader } from "@/components/ui/animated-loader";
import { useWalletTopUp } from "./wallet-funding";
import { usePagedResource } from "./paging";
import { useEffect, useState } from "react";
import { MobilePageHeader } from "./mobile";
import { useMobileLayout } from "./use-mobile-layout";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  BellOff,
  CheckCheck,
  Clock3,
  Eye,
  CircleCheck,
  MapPin,
  Pencil,
  Trash2,
  Search,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Heart,
  LogOut,
  MessageCircle,
  Plus,
  UserRound,
  Wallet,
} from "lucide-react";
import { displayPrice } from "@/lib/propertysetu";
import { dateTime, formatAmount, productRequest, readable, uploadFile } from "@/lib/explorer";
import type {
  ChatThread,
  Inquiry,
  NotificationItem,
  PropertyCard,
  SavedSearch,
  UserProfile,
  Visit,
  WalletTransaction,
} from "@/lib/explorer-types";
import { useAction, useProduct, useResource } from "./context";
import {
  ActionError,
  LoadMore,
  ConfirmAction,
  ExploreLink,
  ExplorerCard,
  Field,
  PageHeading,
  RemoteState,
} from "./ui";

export function WalletPage({ historyOnly = false }: { historyOnly?: boolean }) {
  const app = useProduct();
  const action = useAction();
  const wallet = useResource<{ balance: number }>("/wallet", app.token, app.refresh);
  const history = useResource<WalletTransaction[]>("/wallet/transactions", app.token, app.refresh);
  const [amount, setAmount] = useState("100");
  const { pending, topUp } = useWalletTopUp();
  return (
    <div className="xp-page xp-wallet-page">
      <PageHeading
        title={historyOnly ? "Payment history" : "My wallet"}
        description="A simple way to manage your listing credits."
        action={
          !historyOnly ? (
            <ExploreLink className="xp-button secondary" view="history">
              View history
              <ArrowUpRight size={16} />
            </ExploreLink>
          ) : (
            <ExploreLink className="xp-button secondary" view="wallet">
              Back to wallet
            </ExploreLink>
          )
        }
      />
      {!historyOnly && (
        <div className="xp-wallet-layout">
          <section className="xp-wallet-balance">
            <span className="xp-wallet-icon">
              <Wallet size={26} />
            </span>
            <span>AVAILABLE BALANCE</span>
            <RemoteState {...wallet}>
              {wallet.data && <h2>{formatAmount(wallet.data.balance)}</h2>}
            </RemoteState>
            <p>Use your balance to publish and upgrade property listings.</p>
            <div>
              <Check size={14} />
              Payments verified by our server
            </div>
          </section>
          <section className="xp-panel">
            <h2>Add money to your wallet</h2>
            <p className="xp-help">
              Choose an amount. Pay securely using UPI, cards, or netbanking.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void action.run(async () => {
                  if (!app.token) return;
                  const value = Number(amount);
                  if (!pending && (!Number.isInteger(value) || value < 1 || value > 100000))
                    throw new Error("Enter an amount from ₹1 to ₹1,00,000.");
                  await topUp(value);
                  app.notify("Payment verified. Your wallet has been updated.");
                });
              }}
            >
              <Field label="Amount (₹)">
                <input
                  type="number"
                  min="1"
                  max="100000"
                  step="1"
                  required
                  disabled={Boolean(pending) || action.busy}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <div className="xp-amounts">
                {[100, 200, 500, 1000].map((value) => (
                  <button
                    type="button"
                    key={value}
                    disabled={Boolean(pending) || action.busy}
                    className={amount === String(value) ? "active" : ""}
                    onClick={() => setAmount(String(value))}
                  >
                    ₹{value.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
              {pending && (
                <p className="xp-notice">
                  Your payment needs verification. Retry verification here before making another
                  payment.
                </p>
              )}
              <ActionError error={action.error} />
              <button className="xp-button full" disabled={action.busy}>
                {action.busy ? (
                  <>
                    <AnimatedLoader size="small" color="currentColor" />
                    Processing…
                  </>
                ) : pending ? (
                  "Retry payment verification"
                ) : (
                  `Add ${formatAmount(Number(amount) || 0)}`
                )}
                <ArrowUpRight size={17} />
              </button>
            </form>
            <ExploreLink view="history" className="xp-wallet-history-link">
              Payment history
              <ChevronRight size={18} />
            </ExploreLink>
          </section>
        </div>
      )}
      <section className={`xp-panel ${historyOnly ? "" : "xp-wallet-recent"}`}>
        <div className="xp-row">
          <h2>Transactions</h2>
          <button
            className="xp-text-button"
            onClick={() => {
              wallet.reload();
              history.reload();
            }}
          >
            Refresh
          </button>
        </div>
        <RemoteState
          {...history}
          empty={history.data?.length === 0}
          emptyText="No transactions yet"
        >
          {history.data?.map((item) => (
            <div className="xp-transaction" key={item.id}>
              <span className={`xp-transaction-icon ${item.direction}`}>
                {item.direction === "credit" ? (
                  <ArrowDownLeft size={22} />
                ) : (
                  <ArrowUpRight size={22} />
                )}
              </span>
              <div>
                <strong>{readable(item.reason)}</strong>
                <p>{item.property_title || "Wallet transaction"}</p>
                <small>{dateTime(item.created_at)}</small>
              </div>
              <strong className={item.direction === "credit" ? "xp-credit" : ""}>
                {item.direction === "credit" ? "+" : "−"}
                {formatAmount(item.amount)}
              </strong>
            </div>
          ))}
        </RemoteState>
      </section>
    </div>
  );
}
function ProfileActivity() {
  const app = useProduct();
  const stats = useResource<{
    visits: number;
    likes: number;
    days: { day: string; visits: number; likes: number }[];
  }>("/me/property-stats", app.token, app.refresh);
  const peak = Math.max(
    1,
    ...(stats.data?.days || []).map((day) => Math.max(day.visits, day.likes)),
  );
  return (
    <section className="xp-panel xp-profile-activity">
      <h2>Listing activity</h2>
      <p>See how people interact with your properties.</p>
      <RemoteState {...stats}>
        {stats.data && (
          <>
            <div className="xp-native-activity-totals">
              <div>
                <span>Property views</span>
                <strong>{stats.data.visits}</strong>
              </div>
              <div>
                <span>Saved by others</span>
                <strong>{stats.data.likes}</strong>
              </div>
            </div>
            {Boolean(stats.data.days?.length) && (
              <>
                <h3>Last 7 days</h3>
                <div
                  className="xp-native-activity-chart"
                  role="img"
                  aria-label="Property views and saves over the last seven days"
                >
                  {stats.data.days.map((day) => (
                    <div
                      key={day.day}
                      title={`${day.day}: ${day.visits} views, ${day.likes} saves`}
                    >
                      <div>
                        <span style={{ height: Math.max(4, (day.visits / peak) * 78) }} />
                        <span style={{ height: Math.max(4, (day.likes / peak) * 78) }} />
                      </div>
                      <small>
                        {new Date(`${day.day}T00:00:00`).toLocaleDateString("en-IN", {
                          weekday: "narrow",
                        })}
                      </small>
                    </div>
                  ))}
                </div>
                <div className="xp-native-activity-legend">
                  <span>Property views</span>
                  <span>Saved by others</span>
                </div>
              </>
            )}
          </>
        )}
      </RemoteState>
    </section>
  );
}
export function ProfilePage() {
  const { text } = useExplorerLanguage();
  const app = useProduct();
  const mobile = useMobileLayout();
  const wallet = useResource<{ balance: number }>(
    app.token ? "/wallet" : null,
    app.token,
    app.refresh,
  );
  const action = useAction();
  const [editing, setEditing] = useState(false);
  const profile = app.me?.profile;
  const [avatar, setAvatar] = useState<string | null>(null);
  useEffect(() => {
    setAvatar(profile?.avatar_url || null);
  }, [profile?.avatar_url]);
  if (!app.ready) return <AnimatedLoader fullScreen label="Restoring your session" />;
  if (!app.token)
    return (
      <div className="xp-page xp-profile-guest">
        <span className="xp-profile-avatar">
          <UserRound size={36} />
        </span>
        <h1>{text("Guest")}</h1>
        <button className="xp-button" onClick={app.requireLogin}>
          {text("Sign in")}
        </button>
        <LanguageSelection />
      </div>
    );
  return (
    <div className="xp-page xp-profile-page">
      <PageHeading
        title="My profile"
        description="Your details, properties, and everything in between."
      />
      <div className={`xp-profile-layout ${editing ? "xp-profile-editing" : ""}`}>
        <section className="xp-panel">
          <div className="xp-profile-summary">
            <span className="xp-profile-avatar">
              {avatar ? <img src={avatar} alt="" /> : <UserRound size={36} />}
            </span>
            <h2>{profile?.full_name || app.session?.user.phone || "Welcome home"}</h2>
            <p>{profile?.phone || app.session?.user.phone}</p>
            <button className="xp-button secondary" onClick={() => setEditing(!editing)}>
              {editing ? "Close editor" : "Edit profile"}
            </button>
          </div>
          {editing && (
            <form
              key={profile?.id}
              onSubmit={(event) => {
                event.preventDefault();
                const data = Object.fromEntries(new FormData(event.currentTarget));
                void action.run(async () => {
                  await productRequest("/me", app.token, "PATCH", { ...data, avatar_url: avatar });
                  await app.refreshMe();
                  setEditing(false);
                  app.notify("Profile updated.");
                });
              }}
            >
              <Field label="Profile photo">
                <input
                  type="file"
                  accept="image/*"
                  disabled={action.busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file && app.token)
                      void action.run(async () => setAvatar(await uploadFile(file, app.token!)));
                  }}
                />
              </Field>
              {["full_name", "phone", "city", "district", "state", "pincode"].map((name) => (
                <Field key={name} label={readable(name)}>
                  <input
                    name={name}
                    defaultValue={String(profile?.[name as keyof UserProfile] || "")}
                    maxLength={name === "phone" ? 20 : name === "pincode" ? 12 : 120}
                  />
                </Field>
              ))}
              <Field label="About you">
                <textarea name="bio" maxLength={1000} defaultValue={profile?.bio || ""} />
              </Field>
              <ActionError error={action.error} />
              <button className="xp-button" disabled={action.busy}>
                {action.busy ? "Saving…" : "Save changes"}
              </button>
            </form>
          )}
        </section>
        {!editing && (
          <>
            <section className="xp-panel xp-profile-wallet">
              <span>{text("Available balance")}</span>
              <RemoteState {...wallet}>
                {wallet.data && <h2>{formatAmount(wallet.data.balance)}</h2>}
              </RemoteState>
              <div className="xp-actions">
                <ExploreLink view="wallet" className="xp-button">
                  {text("Add money")}
                </ExploreLink>
                <ExploreLink view="history" className="xp-button secondary">
                  {text("History")}
                </ExploreLink>
              </div>
            </section>
            {mobile && (
              <>
                <ProfileActivity />
                <LanguageSelection />
              </>
            )}
            <section className="xp-profile-properties">
              <h2>{text("My properties")}</h2>
              <MyPropertiesPage embedded />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
export function SavedPropertiesPage() {
  const app = useProduct();
  const list = usePagedResource<PropertyCard>("/favorites", app.token, app.refresh);
  const action = useAction();
  return (
    <div className="xp-page">
      <PageHeading title="Saved properties" description="The places you’d like to come back to." />
      <ActionError error={action.error} />
      <RemoteState {...list} empty={list.data?.length === 0} emptyText="Find a place worth saving">
        <div className="property-grid xp-grid">
          {list.data?.map((row) => (
            <ExplorerCard
              row={row}
              key={row.id}
              saved
              onSave={() =>
                void action.run(async () => {
                  await productRequest(`/properties/${row.id}/favorite`, app.token, "DELETE");
                  list.reload();
                  app.changed();
                })
              }
            />
          ))}
        </div>
      </RemoteState>
      <LoadMore resource={list} />
    </div>
  );
}
function MobileOwnedPropertyCard({
  row,
  embedded,
  reload,
}: {
  row: PropertyCard;
  embedded: boolean;
  reload: () => void;
}) {
  const app = useProduct();
  const active = row.status === "published";
  const closed = row.status === "sold" || row.status === "rented";
  const stillListed = !row.expires_at || new Date(row.expires_at).getTime() > Date.now();
  const trialDays =
    embedded && active && row.listing_term === "trial" && row.expires_at
      ? Math.max(0, Math.ceil((new Date(row.expires_at).getTime() - Date.now()) / 86400000))
      : 0;
  async function setStatus(status: string) {
    await productRequest(`/properties/${row.id}`, app.token, "PATCH", { status });
    reload();
    app.changed();
  }
  return (
    <section className="xp-owned xp-native-owned">
      <ExploreLink view="details" id={row.slug || row.id} className="xp-native-owned-link">
        <div className="xp-native-owned-photo">
          {row.cover_image && <img src={row.cover_image} alt="" />}
          {(row.is_premium || row.listing_label === "Premium") && (
            <span className="xp-native-owned-premium">Premium</span>
          )}
          {active && (
            <span className="xp-native-owned-active" aria-label="Active listing">
              <CircleCheck size={18} />
            </span>
          )}
          {closed && <span className="xp-native-owned-closed">{readable(row.status)}</span>}
        </div>
        <div className="xp-native-owned-copy">
          <h2 title={row.title}>{row.title}</h2>
          <p>{displayPrice(row.price)}</p>
          <div className="xp-native-owned-location">
            <MapPin size={11} />
            <span>
              {[row.locality, row.city].filter(Boolean).join(", ") || "Location not provided"}
            </span>
          </div>
        </div>
      </ExploreLink>
      <div className="xp-native-owned-footer">
        <div className="xp-native-owned-actions">
          <ExploreLink view="create" id={row.id} aria-label="Edit">
            <Pencil size={14} />
            Edit
          </ExploreLink>
          <ConfirmAction
            danger
            icon={<Trash2 size={14} />}
            label="Delete"
            title="Delete this property permanently?"
            description="This action cannot be undone."
            onConfirm={async () => {
              await productRequest(`/properties/${row.id}?hard=true`, app.token, "DELETE");
              reload();
              app.changed();
            }}
          />
        </div>
        {active && (
          <ConfirmAction
            label={row.listing_type === "sale" ? "Mark as sold" : "Mark as rented"}
            title={
              row.listing_type === "sale"
                ? "Mark this property as sold?"
                : "Mark this property as rented?"
            }
            description="It will be shown as unavailable to buyers. You can list it again while its listing period is active."
            onConfirm={() => setStatus(row.listing_type === "sale" ? "sold" : "rented")}
          />
        )}
        {closed && stillListed && (
          <ConfirmAction
            label="List again"
            title="List this property again?"
            description="This property will be available to buyers again during its current listing period."
            onConfirm={() => setStatus("published")}
          />
        )}
        {["expired", "draft", "pending_review"].includes(row.status) && (
          <ExploreLink view="create" id={row.id} className="xp-native-owned-plan">
            Manage listing plan
          </ExploreLink>
        )}
        {trialDays > 0 && <span className="xp-native-owned-trial">{trialDays} free days left</span>}
        {!active && (
          <span className="xp-native-owned-status">
            {readable(row.status === "pending_review" ? "draft" : row.status)}
          </span>
        )}
      </div>
    </section>
  );
}

export function MyPropertiesPage({ embedded = false }: { embedded?: boolean } = {}) {
  const app = useProduct();
  const mobile = useMobileLayout();
  const [tab, setTab] = useState("active");
  const list = usePagedResource<PropertyCard>("/properties?mine=true", app.token, app.refresh);
  const stats = useResource<{ visits: number; likes: number }>(
    "/me/property-stats",
    app.token,
    app.refresh,
  );
  const action = useAction();
  const shown = (list.data || []).filter(
    (row) =>
      !mobile ||
      embedded ||
      (tab === "active"
        ? row.status === "published"
        : tab === "draft"
          ? ["draft", "pending_review"].includes(row.status)
          : row.status === tab),
  );
  useEffect(() => {
    if (
      mobile &&
      !embedded &&
      !list.loading &&
      !list.loadingMore &&
      list.hasMore &&
      !list.error &&
      !list.errorMore &&
      shown.length < 8
    )
      void list.loadMore();
  }, [mobile, embedded, list, shown.length]);

  return (
    <div className={`xp-page xp-properties-page ${embedded ? "xp-embedded-properties" : ""}`}>
      <PageHeading
        title="My properties"
        description="Give every listing a little room to grow."
        action={
          <ExploreLink view="create" className="xp-button">
            <Plus size={16} />
            Post property
          </ExploreLink>
        }
      />
      {!embedded && (
        <div className="xp-native-tabs" role="group" aria-label="Property status">
          {["active", "expired", "draft", "sold", "rented"].map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
            >
              {readable(value)}
            </button>
          ))}
        </div>
      )}
      {!embedded && !list.loading && (
        <>
          <div className="xp-stats" aria-busy={stats.loading}>
            <div>
              <span>Property views</span>
              <strong>{stats.data?.visits ?? "—"}</strong>
            </div>
            <div>
              <span>Saved by others</span>
              <strong>{stats.data?.likes ?? "—"}</strong>
            </div>
            <div>
              <span>Your listings</span>
              <strong>{list.data?.length ?? "—"}</strong>
            </div>
          </div>
          {stats.error && (
            <div className="xp-notice" role="alert">
              Property statistics are unavailable. Your listings are shown below.
              <button onClick={stats.reload}>Retry statistics</button>
            </div>
          )}
        </>
      )}
      <ActionError error={action.error} />
      <RemoteState {...list} empty={shown.length === 0} emptyText="Your first listing starts here">
        <div className="xp-owned-grid">
          {shown.map((row) =>
            mobile ? (
              <MobileOwnedPropertyCard
                key={row.id}
                row={row}
                embedded={embedded}
                reload={list.reload}
              />
            ) : (
              <section className="xp-panel xp-owned" key={row.id}>
                <ExploreLink view="details" id={row.slug || row.id}>
                  {row.cover_image && <img src={row.cover_image} alt="" />}
                  <div>
                    <span className={`xp-status ${row.status}`}>{readable(row.status)}</span>
                    <h2>{row.title}</h2>
                    <p>{displayPrice(row.price)}</p>
                    <small>
                      {row.expires_at ? `Expires ${dateTime(row.expires_at)}` : "Not yet published"}
                    </small>
                  </div>
                </ExploreLink>
                <div className="xp-actions">
                  <ExploreLink className="xp-button secondary" view="create" id={row.id}>
                    <Pencil size={14} />
                    Edit / manage plan
                  </ExploreLink>
                  {row.status !== "archived" && (
                    <ConfirmAction
                      label="Archive"
                      title="Archive this property?"
                      description="It will be removed from public browsing. You can still manage it here."
                      onConfirm={async () => {
                        await productRequest(`/properties/${row.id}`, app.token, "DELETE");
                        list.reload();
                        app.changed();
                      }}
                    />
                  )}
                  <ConfirmAction
                    danger
                    icon={<Trash2 size={14} />}
                    label="Delete"
                    title="Delete this property permanently?"
                    description="This action cannot be undone."
                    onConfirm={async () => {
                      await productRequest(`/properties/${row.id}?hard=true`, app.token, "DELETE");
                      list.reload();
                      app.changed();
                    }}
                  />
                </div>
                {["published", "sold", "rented"].includes(row.status) && (
                  <Field label="Listing status">
                    <select
                      value={row.status}
                      disabled={action.busy}
                      onChange={(e) =>
                        void action.run(async () => {
                          await productRequest(`/properties/${row.id}`, app.token, "PATCH", {
                            status: e.target.value,
                          });
                          app.changed();
                        })
                      }
                    >
                      {["published", row.listing_type === "sale" ? "sold" : "rented"].map(
                        (status) => (
                          <option key={status} value={status}>
                            {readable(status)}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                )}
              </section>
            ),
          )}
        </div>
      </RemoteState>
      <LoadMore resource={list} />
    </div>
  );
}

export function InquiriesPage() {
  const app = useProduct();
  const mobile = useMobileLayout();
  const [tab, setTab] = useState("new");
  const list = useResource<Inquiry[]>("/inquiries", app.token, app.refresh);
  const action = useAction();
  const shown = (list.data || []).filter(
    (item) =>
      !mobile ||
      (tab === "new"
        ? ["new", "interested"].includes(item.status)
        : tab === "closed"
          ? ["closed", "spam"].includes(item.status)
          : item.status === tab),
  );
  return (
    <div className="xp-page">
      <PageHeading title="Inquiries" description="Turn interest into a conversation." />
      <div className="xp-native-tabs" role="group" aria-label="Enquiry status">
        {["new", "contacted", "closed"].map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {readable(value)}
          </button>
        ))}
      </div>
      <ActionError error={action.error} />
      <RemoteState {...list} empty={shown.length === 0} emptyText="No inquiries yet">
        <div className="xp-list">
          {shown.map((item) => (
            <section className="xp-panel xp-inquiry-card" key={item.id}>
              <div className="xp-row">
                <ExploreLink view="details" id={item.property_slug || item.property_id}>
                  <h2>{item.property_title || "Property inquiry"}</h2>
                </ExploreLink>
                <span className="xp-status">{item.status}</span>
              </div>
              <p>{item.message || readable(item.inquiry_type)}</p>
              <p className="xp-help">
                {item.name || "Interested buyer"} · {dateTime(item.created_at)}
              </p>
              <div className="xp-actions">
                {item.phone && (
                  <a className="xp-button secondary" href={`tel:${item.phone}`}>
                    Call {item.phone}
                  </a>
                )}
                {item.buyer_id && item.buyer_id !== app.session?.user.id && (
                  <button
                    className="xp-button secondary"
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(async () => {
                        const thread = await productRequest<ChatThread>(
                          `/properties/${item.property_id}/chat`,
                          app.token,
                          "POST",
                          { buyer_id: item.buyer_id },
                        );
                        app.go("chat", thread.id);
                      })
                    }
                  >
                    Reply in chat
                  </button>
                )}
                {item.email && (
                  <a className="xp-text-button" href={`mailto:${item.email}`}>
                    Email
                  </a>
                )}
                <select
                  aria-label={`Status for inquiry ${item.id}`}
                  value={item.status}
                  disabled={action.busy}
                  onChange={(e) =>
                    void action.run(async () => {
                      await productRequest(`/inquiries/${item.id}`, app.token, "PATCH", {
                        status: e.target.value,
                      });
                      list.reload();
                    })
                  }
                >
                  {["new", "contacted", "interested", "closed", "spam"].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>
            </section>
          ))}
        </div>
      </RemoteState>
    </div>
  );
}
export function VisitsPage() {
  const app = useProduct();
  const mobile = useMobileLayout();
  const list = useResource<Visit[]>("/visits", app.token, app.refresh);
  const action = useAction();
  return (
    <div className="xp-page">
      <PageHeading title="Property visits" description="Make time to see the possibilities." />
      <ActionError error={action.error} />
      <RemoteState {...list} empty={list.data?.length === 0} emptyText="No visits scheduled">
        <div className="xp-list">
          {list.data?.map((item) => (
            <section className="xp-panel xp-visit-card" key={item.id}>
              {mobile ? (
                <>
                  <ExploreLink
                    view="details"
                    id={item.property_slug || item.property_id}
                    className="xp-native-visit"
                  >
                    <span className="xp-native-visit-photo">
                      {item.cover_image ? (
                        <img src={item.cover_image} alt="" />
                      ) : (
                        <Building2 size={26} />
                      )}
                    </span>
                    <div>
                      <div className="xp-native-visit-title">
                        <h2>{item.property_title || "Property visit"}</h2>
                        <span className={`xp-status ${item.status}`}>{readable(item.status)}</span>
                      </div>
                      <p>{[item.locality, item.city].filter(Boolean).join(", ")}</p>
                      <strong>
                        <CalendarDays size={14} />
                        {item.scheduled_at ? dateTime(item.scheduled_at) : "Time not set"}
                      </strong>
                    </div>
                  </ExploreLink>
                  {item.status === "requested" && item.buyer_id !== app.session?.user.id && (
                    <button
                      className="xp-button full"
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(async () => {
                          await productRequest(`/visits/${item.id}`, app.token, "PATCH", {
                            status: "confirmed",
                          });
                          list.reload();
                        })
                      }
                    >
                      Confirm visit
                    </button>
                  )}
                </>
              ) : (
                <>
                  {" "}
                  <div className="xp-row">
                    <ExploreLink view="details" id={item.property_slug || item.property_id}>
                      <h2>{item.property_title || "Property visit"}</h2>
                    </ExploreLink>
                    <span className="xp-status">{item.status}</span>
                  </div>
                  <p>
                    <CalendarDays size={16} className="xp-inline-icon" />{" "}
                    {dateTime(item.scheduled_at)}
                  </p>
                  <p className="xp-help">{item.notes}</p>
                </>
              )}
              <details className="xp-visit-controls" open={!mobile}>
                <summary>Manage visit</summary>
                <form
                  className="xp-actions"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    void action.run(async () => {
                      const time = String(form.get("scheduled_at") || "");
                      if (time && new Date(time).getTime() <= Date.now())
                        throw new Error("Choose a future time.");
                      await productRequest(`/visits/${item.id}`, app.token, "PATCH", {
                        status: time ? "rescheduled" : form.get("status"),
                        ...(time ? { scheduled_at: new Date(time).toISOString() } : {}),
                        notes: form.get("notes"),
                      });
                      list.reload();
                    });
                  }}
                >
                  <select name="status" defaultValue={item.status} aria-label="Visit status">
                    {["requested", "confirmed", "completed", "cancelled", "rescheduled"].map(
                      (status) => (
                        <option key={status}>{status}</option>
                      ),
                    )}
                  </select>
                  <input
                    type="datetime-local"
                    name="scheduled_at"
                    aria-label="Reschedule date and time"
                  />
                  <input
                    name="notes"
                    defaultValue={item.notes || ""}
                    maxLength={1000}
                    placeholder="Visit notes"
                    aria-label="Visit notes"
                  />
                  <button className="xp-button secondary" disabled={action.busy}>
                    Update visit
                  </button>
                </form>
              </details>
            </section>
          ))}
        </div>
      </RemoteState>
    </div>
  );
}
function notificationDay(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}
function notificationVisual(type: string) {
  if (type === "saved_search") return { Icon: Search, chip: "Search", tone: "primary" };
  if (type === "property_view") return { Icon: Eye, chip: "Viewed", tone: "primary" };
  if (type === "new_inquiry") return { Icon: MessageCircle, chip: "Enquiry", tone: "primary" };
  if (type === "visit_confirmed") return { Icon: Check, chip: "Visit", tone: "success" };
  if (type === "visit_request") return { Icon: CalendarDays, chip: "Visit", tone: "warning" };
  return { Icon: Bell, chip: "Update", tone: "primary" };
}
export function NotificationsPage() {
  const app = useProduct();
  const list = useResource<NotificationItem[]>("/notifications", app.token, app.refresh);
  const action = useAction();
  const [filter, setFilter] = useState("all");
  const unread = list.data?.filter((item) => !item.is_read).length || 0;
  const shown = (list.data || []).filter((item) =>
    filter === "enquiry"
      ? item.type === "new_inquiry"
      : filter === "visit"
        ? ["visit_request", "visit_confirmed"].includes(item.type)
        : true,
  );
  function markAll() {
    void action.run(async () => {
      await productRequest("/notifications/read", app.token, "PATCH");
      list.reload();
    });
  }
  return (
    <div className="xp-page xp-notifications-page">
      <MobilePageHeader
        title="Notifications"
        subtitle={
          unread
            ? `${unread} unread notification${unread === 1 ? "" : "s"}`
            : "You're all caught up"
        }
        right={
          <button
            type="button"
            className="xp-notifications-mark"
            aria-label="Mark all as read"
            disabled={action.busy || !unread}
            onClick={markAll}
          >
            <CheckCheck size={20} />
          </button>
        }
      />
      <PageHeading
        title="Notifications"
        description="All your property updates, in one place."
        action={
          <button
            className="xp-button secondary"
            disabled={action.busy || !unread}
            onClick={markAll}
          >
            Mark all as read
          </button>
        }
      />
      <div className="xp-notification-filters" role="group" aria-label="Notification filters">
        {(
          [
            ["all", "All"],
            ["enquiry", "Enquiries"],
            ["visit", "Visits"],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <ActionError error={action.error} />
      <RemoteState {...list}>
        <div className="xp-notification-list">
          {shown.map((item, index) => {
            const { Icon, chip, tone } = notificationVisual(item.type);
            const day = notificationDay(item.created_at);
            return (
              <div key={item.id}>
                {(index === 0 || day !== notificationDay(shown[index - 1]!.created_at)) && (
                  <h2 className="xp-notification-day">{day}</h2>
                )}
                <button
                  className={`xp-panel xp-notification ${item.is_read ? "" : "unread"}`}
                  onClick={() =>
                    void action.run(async () => {
                      if (!item.is_read) {
                        await productRequest(`/notifications/${item.id}/read`, app.token, "PATCH");
                        list.reload();
                      }
                      if (item.data?.conversation_id) app.go("chat", item.data.conversation_id);
                      else if (item.data?.property_id) app.go("details", item.data.property_id);
                      else if (item.data?.visit_id) app.go("visits");
                      else if (item.data?.inquiry_id) app.go("inquiries");
                    })
                  }
                >
                  <span className={`xp-notification-icon ${tone}`}>
                    <Icon size={20} />
                  </span>
                  <div className="xp-notification-body">
                    <div className="xp-notification-title">
                      <h2>{item.title}</h2>
                      {!item.is_read && <span className="xp-unread-dot" />}
                    </div>
                    {item.message && <p>{item.message}</p>}
                    <div className="xp-notification-meta">
                      <Clock3 size={13} />
                      <time dateTime={item.created_at}>
                        {new Date(item.created_at).toLocaleTimeString("en-IN", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                      <span className={`xp-notification-chip ${tone}`}>{chip}</span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
          {!list.loading && !list.error && !shown.length && (
            <div className="xp-notification-empty">
              <BellOff size={34} />
              <h2>No notifications</h2>
              <p>Your property updates will appear here.</p>
            </div>
          )}
        </div>
      </RemoteState>
    </div>
  );
}
export function SavedSearchesPage() {
  const app = useProduct();
  const list = useResource<(SavedSearch & { q?: string })[]>(
    "/saved-searches",
    app.token,
    app.refresh,
  );
  return (
    <div className="xp-page">
      <PageHeading
        title="Saved searches"
        description="Keep your search close. We’ll notify you about new matches."
      />
      <RemoteState
        {...list}
        empty={list.data?.length === 0}
        emptyText="Save a search while exploring"
      >
        <div className="xp-list">
          {list.data?.map((item) => (
            <section className="xp-panel" key={item.id}>
              <h2>{item.name}</h2>
              <p className="xp-help">
                {[
                  item.q,
                  item.city,
                  item.listing_type,
                  item.max_price ? `Up to ${displayPrice(item.max_price)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <button
                className="xp-button secondary"
                onClick={() =>
                  app.search({
                    ...(item.q ? { q: item.q } : {}),
                    ...(item.city ? { city: item.city } : {}),
                    ...(item.listing_type ? { listing_type: item.listing_type } : {}),
                    ...(item.category_id ? { category: item.category_id } : {}),
                    ...(item.max_price ? { max_price: String(item.max_price) } : {}),
                    ...(item.min_price ? { min_price: String(item.min_price) } : {}),
                    ...(item.bedrooms ? { bedrooms: String(item.bedrooms) } : {}),
                  })
                }
              >
                Run search
              </button>{" "}
              <ConfirmAction
                label="Remove search"
                title="Remove saved search?"
                description="You will stop receiving updates for this search."
                onConfirm={async () => {
                  await productRequest(`/saved-searches/${item.id}`, app.token, "DELETE");
                  list.reload();
                }}
              />
            </section>
          ))}
        </div>
      </RemoteState>
    </div>
  );
}
export function BlockedUsersPage() {
  const app = useProduct();
  const list = useResource<Array<{ blocked_id: string; full_name: string | null }>>(
    "/me/blocks",
    app.token,
    app.refresh,
  );
  return (
    <div className="xp-page">
      <PageHeading
        title="Blocked users"
        description="You’re in control of who can connect with you."
      />
      <RemoteState {...list} empty={list.data?.length === 0} emptyText="No blocked users">
        {list.data?.map((item) => (
          <section className="xp-panel xp-row" key={item.blocked_id}>
            <h2>{item.full_name || "Blocked user"}</h2>
            <ConfirmAction
              label="Unblock"
              title="Unblock this user?"
              description="Their messages and listings can appear again."
              onConfirm={async () => {
                await productRequest(`/users/${item.blocked_id}/block`, app.token, "DELETE");
                list.reload();
                app.changed();
              }}
            />
          </section>
        ))}
      </RemoteState>
    </div>
  );
}
