import { useExplorerLanguage } from "./language";
import { MobilePageHeader } from "./mobile";
import { AnimatedLoader } from "@/components/ui/animated-loader";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  ChevronDown,
  ReceiptText,
  Heart,
  House,
  Info,
  LogOut,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Shield,
  UserRound,
  Wallet,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { explorerHref, type ExplorerView } from "@/lib/explorer";
import { displayPrice } from "@/lib/propertysetu";
import type { PropertyCard } from "@/lib/explorer-types";
import { useExplorer, useProduct, useAction } from "./context";

export function ExploreLink({
  view,
  id,
  children,
  onClick,
  ...props
}: {
  view: ExplorerView;
  id?: string | undefined;
  children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const app = useExplorer();
  return (
    <a
      {...props}
      href={explorerHref(view, id)}
      onClick={(event) => {
        onClick?.(event);
        if (
          app &&
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          app.go(view, id);
        }
      }}
    >
      {children}
    </a>
  );
}
const menuItems = [
  { view: "home", label: "Home", icon: House },
  { view: "search", label: "Search properties", icon: Search },
  { view: "map", label: "Property map", icon: MapPin },
  { view: "create", label: "Post a property", icon: Plus },
  { view: "saved", label: "Saved properties", icon: Heart },
  { view: "my-properties", label: "My properties", icon: Building2 },
  { view: "wallet", label: "My wallet", icon: Wallet },
  { view: "history", label: "Payment history", icon: ReceiptText },
  { view: "chats", label: "Messages", icon: MessageCircle },
  { view: "inquiries", label: "Inquiries", icon: MessageCircle },
  { view: "visits", label: "Visits", icon: CalendarDays },
  { view: "notifications", label: "Notifications", icon: Bell },
  { view: "saved-searches", label: "Saved searches", icon: Search },
  { view: "profile", label: "My profile", icon: UserRound },
  { view: "blocked", label: "Blocked users", icon: Shield },
  { view: "about", label: "About", icon: Info },
] satisfies Array<{ view: ExplorerView; label: string; icon: typeof House }>;
export function MenuItems({ onClose }: { onClose?: () => void }) {
  const app = useProduct();
  return (
    <>
      {menuItems.map((item) => (
        <ExploreLink
          view={item.view}
          key={item.view}
          onClick={onClose}
          className={app.location.view === item.view ? "active" : ""}
        >
          <item.icon size={19} />
          <span>{item.label}</span>
          <ChevronRight size={15} />
        </ExploreLink>
      ))}
    </>
  );
}
export function AccountMenu() {
  const app = useProduct();
  const [open, setOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const accountViews: ExplorerView[] = [
    "profile",
    "my-properties",
    "create",
    "saved",
    "wallet",
    "history",
    "inquiries",
    "visits",
  ];
  const groups = [
    { label: "My account", items: menuItems.filter((item) => accountViews.includes(item.view)) },
    {
      label: "Explore & more",
      items: menuItems.filter((item) => !accountViews.includes(item.view)),
    },
  ];
  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button type="button" className="xp-account-trigger" aria-label="My account">
            {app.me?.profile?.avatar_url ? (
              <img src={app.me.profile.avatar_url} alt="" />
            ) : (
              <UserRound size={20} aria-hidden="true" />
            )}
            <span>My account</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={10}
          collisionPadding={16}
          className="xp-account-dropdown-content"
          aria-label="Account options"
        >
          {groups.map((group) => (
            <DropdownMenuGroup key={group.label}>
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              {group.items.map((item) => (
                <DropdownMenuItem asChild key={item.view}>
                  <ExploreLink
                    view={item.view}
                    aria-current={app.location.view === item.view ? "page" : undefined}
                  >
                    <item.icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </ExploreLink>
                </DropdownMenuItem>
              ))}
              {group.label === "My account" && (
                <>
                  <DropdownMenuSeparator />
                  {app.token ? (
                    <DropdownMenuItem
                      className="xp-account-signout"
                      onSelect={() => setSignOutOpen(true)}
                    >
                      <LogOut size={18} aria-hidden="true" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <ExploreLink view="login">
                        <UserRound size={18} aria-hidden="true" />
                        <span>Sign in or create account</span>
                      </ExploreLink>
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {group.label === "Explore & more" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/privacy">
                      <Shield size={18} aria-hidden="true" />
                      <span>Privacy policy</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/terms">
                      <ReceiptText size={18} aria-hidden="true" />
                      <span>Terms & community rules</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/">
                      <ArrowLeft size={18} aria-hidden="true" />
                      <span>Back to website</span>
                    </a>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog.Root open={signOutOpen} onOpenChange={setSignOutOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="xp-modal-overlay" />
          <Dialog.Content className="xp-modal">
            <Dialog.Title>Sign out?</Dialog.Title>
            <Dialog.Description>You can sign in again using your mobile number.</Dialog.Description>
            <div className="xp-actions">
              <Dialog.Close className="xp-button secondary">Cancel</Dialog.Close>
              <button
                className="xp-button"
                onClick={() => {
                  app.signOut();
                  setSignOutOpen(false);
                  app.go("home");
                }}
              >
                Sign out
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
export function AppChrome({ children }: { children: ReactNode }) {
  const { text } = useExplorerLanguage();
  const app = useProduct();
  const isHome = app.location.view === "home" || app.location.view === "search";
  return (
    <div className={`property-home xp-app xp-view-${app.location.view}`}>
      {app.location.view !== "login" && (
        <header className="xp-header">
          <div className="home-container">
            <a href="/" className="brand" aria-label="PropertySetu website home">
              <img src="/images/logo-emblem.png" className="brand-logo" alt="" />
              <span className="brand-name">
                Property<span>Setu</span>
              </span>
            </a>
            <nav aria-label="Product navigation">
              <ExploreLink view="home" className={isHome ? "active" : ""}>
                Discover
              </ExploreLink>
              <ExploreLink view="my-properties">My properties</ExploreLink>
              <ExploreLink view="chats">Messages</ExploreLink>
              <ExploreLink view="wallet">Wallet</ExploreLink>
            </nav>
            <ExploreLink className="home-post" view="create">
              <Plus size={17} />
              Post property
            </ExploreLink>
            {!app.token && (
              <ExploreLink
                className="home-account xp-header-account"
                view="login"
                aria-label="Sign in"
              >
                <UserRound size={19} />
                <span>Sign in</span>
              </ExploreLink>
            )}
            <AccountMenu />
          </div>
        </header>
      )}
      {!isHome &&
        !["login", "profile", "create", "notifications", "chats", "chat", "details"].includes(
          app.location.view,
        ) && (
          <MobilePageHeader
            title={
              menuItems.find((item) => item.view === app.location.view)?.label || "PropertySetu"
            }
          />
        )}
      <div
        className={`xp-workspace ${isHome ? "xp-is-home" : ""} ${["home", "search", "saved", "profile"].includes(app.location.view) ? "xp-has-tabs" : ""}`}
      >
        <div className="xp-content">
          {app.authError && (
            <div className="xp-notice" role="alert">
              {app.authError}
              <button onClick={() => void app.refreshMe()}>Retry</button>
            </div>
          )}
          {children}
        </div>
      </div>
      {["home", "search", "saved", "profile"].includes(app.location.view) && (
        <nav className="home-bottom-nav" aria-label="Mobile navigation">
          {(
            [
              { view: "home", label: "Home", icon: House },
              { view: "search", label: "Search", icon: Search },
              { view: "create", label: "Post property", icon: Plus },
              { view: "saved", label: "Saved", icon: Heart },
              { view: "profile", label: "Profile", icon: UserRound },
            ] as const
          ).map((item) => (
            <ExploreLink
              key={item.view}
              view={item.view}
              aria-label={item.label}
              className={`${app.location.view === item.view ? "active" : ""} ${item.view === "create" ? "home-sell" : ""}`}
              aria-current={app.location.view === item.view ? "page" : undefined}
            >
              {item.view === "create" ? (
                <>
                  <span>
                    <Plus />
                  </span>
                  <small>{text("Sell")}</small>
                </>
              ) : (
                <>
                  {item.view === "profile" && app.token && app.me?.profile?.full_name?.trim() ? (
                    <span className="xp-tab-initial" aria-hidden="true">
                      {Array.from(app.me.profile.full_name.trim())[0]?.toLocaleUpperCase()}
                    </span>
                  ) : (
                    <item.icon />
                  )}
                  <span>{text(item.label)}</span>
                </>
              )}
            </ExploreLink>
          ))}
        </nav>
      )}
    </div>
  );
}
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode;
}) {
  return (
    <div className="xp-page-heading">
      <div>
        <span>PROPERTYSETU</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function RemoteState({
  loading,
  error,
  empty = false,
  retry,
  children,
  emptyText = "Nothing here yet.",
}: {
  loading: boolean;
  error: string;
  empty?: boolean;
  retry: () => void;
  children?: ReactNode;
  emptyText?: string;
}) {
  if (loading) return <AnimatedLoader fullScreen />;
  if (error)
    return (
      <div className="home-empty" role="alert">
        <Building2 />
        <h2>Unable to load this page</h2>
        <p>{error}</p>
        <button className="xp-button" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (empty)
    return (
      <div className="home-empty">
        <Building2 />
        <h2>{emptyText}</h2>
        <p>New activity will appear here.</p>
      </div>
    );
  return <>{children}</>;
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="xp-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function ActionError({ error }: { error: string }) {
  return error ? (
    <p className="xp-error" role="alert">
      {error}
    </p>
  ) : null;
}
export function RequireAccount({ children }: { children: ReactNode }) {
  const app = useProduct();
  if (!app.ready) return <AnimatedLoader fullScreen label="Restoring your session" />;
  if (!app.token)
    return (
      <div className="xp-gate">
        <span className="xp-gate-icon">
          <UserRound size={32} />
        </span>
        <h1>Your next move starts here</h1>
        <p>Sign in to manage properties, save favourites, and connect with owners.</p>
        <button className="xp-button" onClick={app.requireLogin}>
          Sign in or create account
          <ArrowRight size={17} />
        </button>
        <ExploreLink view="home">Continue exploring</ExploreLink>
      </div>
    );
  return <>{children}</>;
}
export function ConfirmAction({
  label,
  icon,
  title,
  description,
  onConfirm,
  danger = false,
}: {
  label: string;
  icon?: ReactNode;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const action = useAction();
  return (
    <>
      <button
        className={danger ? "xp-danger-link" : "xp-text-button"}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        {icon}
        {label}
      </button>
      <Dialog.Root
        open={open}
        onOpenChange={(v) => {
          if (!action.busy) setOpen(v);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="xp-modal-overlay" />
          <Dialog.Content className="xp-modal">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Description>{description}</Dialog.Description>
            <ActionError error={action.error} />
            <div className="xp-actions">
              <Dialog.Close className="xp-button secondary" disabled={action.busy}>
                Cancel
              </Dialog.Close>
              <button
                className={`xp-button ${danger ? "danger" : ""}`}
                disabled={action.busy}
                onClick={() =>
                  void action.run(async () => {
                    await onConfirm();
                    setOpen(false);
                  })
                }
              >
                {action.busy ? (
                  <>
                    <AnimatedLoader size="small" color="currentColor" />
                    Please wait…
                  </>
                ) : (
                  label
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
export function ExplorerCard({
  row,
  onSave,
  saved,
}: {
  row: Pick<PropertyCard, "id" | "title" | "price" | "listing_type"> & Partial<PropertyCard>;
  onSave?: () => void;
  saved?: boolean | undefined;
}) {
  return (
    <article className="property-card xp-property-card">
      <ExploreLink view="details" id={row.id} className="xp-card-link">
        <div className="property-media">
          {row.cover_image ? (
            <img className="property-photo" src={row.cover_image} loading="lazy" alt={row.title} />
          ) : (
            <div className="property-photo property-photo-empty">
              <Building2 />
            </div>
          )}
          <div className="property-badges">
            {row.is_premium || row.listing_label === "Premium" ? (
              <span className="property-premium">Premium</span>
            ) : null}
            <span className="property-type">
              {row.listing_type === "sale" ? "For sale" : `For ${row.listing_type}`}
            </span>
          </div>
        </div>
        <div className="property-details">
          <p className="property-price">{displayPrice(row.price)}</p>
          <h3>{row.title}</h3>
          <p className="property-place">
            <MapPin size={14} />
            {[row.locality, row.city].filter(Boolean).join(", ") || "Location not provided"}
          </p>
          <div className="property-meta">
            {row.bedrooms ? <span>{row.bedrooms} beds</span> : null}
            {row.area ? (
              <span>
                {row.area} {readArea(row.area_unit)}
              </span>
            ) : null}
          </div>
        </div>
      </ExploreLink>
      {onSave && (
        <button
          className={`xp-save ${saved ? "is-saved" : ""}`}
          onClick={onSave}
          aria-label={saved ? `Unsave ${row.title}` : `Save ${row.title}`}
          aria-pressed={Boolean(saved)}
        >
          <Heart size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      )}
    </article>
  );
}
function readArea(value?: string) {
  return (value || "sq_ft").replaceAll("_", " ");
}

export function LoadMore({
  resource,
}: {
  resource: {
    hasMore: boolean;
    loadingMore: boolean;
    errorMore: string;
    loadMore: () => Promise<void>;
  };
}) {
  return (
    <>
      {resource.errorMore && <ActionError error={resource.errorMore} />}{" "}
      {resource.hasMore && (
        <button
          className="xp-button secondary xp-load-more"
          disabled={resource.loadingMore}
          onClick={() => void resource.loadMore()}
        >
          {resource.loadingMore ? (
            <>
              <AnimatedLoader size="small" color="currentColor" />
              Loading…
            </>
          ) : resource.errorMore ? (
            "Retry loading more"
          ) : (
            "Load more properties"
          )}
        </button>
      )}
    </>
  );
}
