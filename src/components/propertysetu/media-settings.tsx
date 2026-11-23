import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { MediaSettings } from "@/lib/mediaSettings";
import { useAdmin } from "./admin";

const fields = [
  { key: "maxPhotos", label: "Photos per property", min: 2, max: 50 },
  { key: "maxVideos", label: "Videos per property (0 disables videos)", min: 0, max: 10 },
  { key: "maxVideoDurationSeconds", label: "Maximum seconds per video", min: 5, max: 600 },
  { key: "photoMaxEdge", label: "Photo maximum side (pixels)", min: 320, max: 3840 },
  { key: "photoQuality", label: "Photo quality (%)", min: 40, max: 100 },
  { key: "photoTargetKb", label: "Target photo size (KB)", min: 30, max: 2048 },
  { key: "videoMaxEdge", label: "Video maximum side (pixels)", min: 320, max: 2160 },
] as const;

export function MediaSettingsForm() {
  const session = useAdmin();
  const [value, setValue] = useState<MediaSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function load() {
    if (!session) return;
    setError("");
    try { setValue(await session.request<MediaSettings>("/api/admin/media-settings")); }
    catch { setError("Could not load photo and video settings. Please retry."); }
  }
  useEffect(() => { void load(); }, [session?.token]);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!session || !value) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const saved = await session.request<MediaSettings>("/api/admin/media-settings", { method: "PATCH", body: JSON.stringify(value) });
      setValue(saved); setNotice("Photo and video settings saved. New uploads use these settings; existing media is unchanged.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save media settings."); }
    finally { setBusy(false); }
  }
  return <section className="admin-section">
    <div className="admin-section-head"><h2>Property photos & videos</h2></div>
    <p className="text-sm text-muted-foreground">Control uploads when adding or editing a property in the app and website. Example: 2 videos and 60 seconds permits two separate videos, each up to one minute. Photos still require a minimum of 2.</p>
    {error && <div role="alert" className="error-notice">{error}{!value && <Button onClick={() => void load()} variant="outline">Retry</Button>}</div>}
    {!value && !error && <p>Loading media settings…</p>}
    {value && <form onSubmit={save}>
      <fieldset disabled={busy}>
        <div className="settings-grid">
          {fields.map(field => <div className="field" key={field.key}>
            <label htmlFor={`media-${field.key}`}>{field.label}</label>
            <input id={`media-${field.key}`} type="number" required min={field.min} max={field.max} step={1} value={value[field.key]} onChange={event => { setValue({ ...value, [field.key]: Number(event.target.value) }); setNotice(""); }} />
          </div>)}
          <div className="field"><label htmlFor="media-videoQuality">Video clarity</label>
            <select id="media-videoQuality" value={value.videoQuality} onChange={event => { setValue({ ...value, videoQuality: event.target.value as MediaSettings["videoQuality"] }); setNotice(""); }}>
              <option value="high">High clarity — larger files</option><option value="balanced">Balanced</option><option value="compact">Smaller files — lower clarity</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Resolution is a maximum, with original proportions preserved. A larger photo size target retains more detail; compression may reduce photo resolution to approach that target. Original low-resolution media cannot be sharpened into HD. Maximum upload size remains 80 MB per file.</p>
        <Button type="submit">{busy ? "Saving…" : "Save media settings"}</Button>
      </fieldset>
    </form>}
    {notice && <p role="status" className="settings-preview">{notice}</p>}
  </section>;
}
