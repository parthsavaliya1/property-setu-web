import { ChevronRight, ShieldCheck, FileText } from "lucide-react";
import { productRequest } from "@/lib/explorer";
import { useProduct } from "./context";
import { ConfirmAction, ExploreLink, PageHeading } from "./ui";

export function AboutPage() {
  const app = useProduct();
  return (
    <div className="xp-page xp-about-page">
      <PageHeading title="About PropertySetu" />
      <section className="xp-panel xp-about-intro">
        <img src="/images/logo-emblem.png" alt="" width={64} height={64} />
        <h2>PropertySetu</h2>
        <p>
          Find properties for sale, rent, lease, and PG. Connect with owners and manage your
          listings in one place.
        </p>
      </section>
      <section className="xp-panel xp-about-links">
        <a href="/privacy">
          <ShieldCheck size={20} />
          <span>Privacy policy</span>
          <ChevronRight size={16} />
        </a>
        <a href="/terms">
          <FileText size={20} />
          <span>Terms and conditions</span>
          <ChevronRight size={16} />
        </a>
        <ExploreLink view="blocked">
          <ShieldCheck size={20} />
          <span>Blocked users</span>
          <ChevronRight size={16} />
        </ExploreLink>
      </section>
      <section className="xp-about-delete">
        <p>You can permanently delete your account and the properties you listed.</p>
        <ConfirmAction
          danger
          label="Delete account"
          title="Permanently delete your account?"
          description="Your account and listings will be removed. This cannot be undone."
          onConfirm={async () => {
            await productRequest("/me", app.token, "DELETE");
            app.signOut();
            app.go("home");
            app.notify("Your account has been deleted.");
          }}
        />
      </section>
    </div>
  );
}
