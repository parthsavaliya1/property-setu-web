import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyTheme, isThemeKey, THEME_PREVIEWS, type ThemeKey, type ThemePreview } from "@/lib/appTheme";
import { useAdmin } from "./admin";

function Swatch({ theme }: { theme: ThemePreview }) {
  return (
    <div className="theme-swatch" style={{ background: theme.page }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: theme.ink, fontSize: 12, fontWeight: 650 }}>PropertySetu</span>
        <span className="theme-badge" style={{ background: theme.badge, color: theme.badgeText }}>New</span>
      </div>
      <div className="theme-swatch-row">
        <div className="theme-swatch-card" style={{ background: theme.card }} />
        <div className="theme-swatch-chip" style={{ background: theme.soft }} />
      </div>
      <div className="theme-swatch-button" style={{ background: theme.primary }}>View listing</div>
    </div>
  );
}

export function ThemeSettings() {
  const session = useAdmin();
  const [selected, setSelected] = useState<ThemeKey>("terracotta");
  const [saved, setSaved] = useState<ThemeKey>("terracotta");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    let active = true;
    session.request<{ theme: string }>("/api/admin/app-theme")
      .then((data) => {
        if (!active || !isThemeKey(data.theme)) return;
        setSelected(data.theme);
        setSaved(data.theme);
      })
      .catch(() => {
        if (active) setError("Could not load the colour theme.");
      });
    return () => {
      active = false;
    };
  }, [session?.token]);

  async function save() {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const data = await session.request<{ theme: string }>("/api/admin/app-theme", {
        method: "PATCH",
        body: JSON.stringify({ theme: selected }),
      });
      const theme = isThemeKey(data.theme) ? data.theme : selected;
      setSaved(theme);
      setSelected(theme);
      applyTheme(theme);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the theme.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-section" style={{ marginTop: 0 }}>
      <div className="admin-section-head"><h2>Colour theme</h2></div>
      <p className="text-sm text-muted-foreground">Terracotta is the current PropertySetu combination. Other themes use the same colour sets as Vadi. Winter, Summer and Monsoon also play a light animation. The website updates now; the mobile app picks it up on the next open.</p>
      {error ? <div role="alert" className="error-notice">{error}</div> : null}
      <div className="theme-grid">
        {THEME_PREVIEWS.map((theme) => {
          const active = selected === theme.key;
          return (
            <button key={theme.key} type="button" className={`theme-option${active ? " is-selected" : ""}`} aria-pressed={active} onClick={() => setSelected(theme.key)}>
              <Swatch theme={theme} />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 12 }}>
                <div>
                  <div style={{ fontWeight: 650, fontSize: 14 }}>
                    {theme.name}
                    {saved === theme.key ? <span className="theme-badge" style={{ marginLeft: 8, background: "var(--secondary)", color: "var(--foreground)" }}>Current</span> : null}
                    {theme.animated ? <span className="theme-badge" style={{ marginLeft: 8, background: "var(--secondary)", color: "var(--foreground)" }}>Animated</span> : null}
                  </div>
                  <div className="text-xs text-muted-foreground" style={{ marginTop: 4 }}>{theme.description}</div>
                </div>
                <span style={{ width: 20, height: 20, borderRadius: 999, border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: active ? "var(--primary)" : "transparent", color: "var(--primary-foreground)" }}>
                  {active ? <Check size={12} /> : null}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}>
        <Button type="button" disabled={busy || selected === saved} onClick={() => void save()}>{busy ? "Saving…" : "Apply theme"}</Button>
      </div>
    </section>
  );
}
