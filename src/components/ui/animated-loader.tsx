import type { CSSProperties } from "react";
type Props = {
  size?: "small" | "large" | number;
  color?: string;
  fullScreen?: boolean;
  label?: string;
};
/** VADI app's 1.8s rotating ring and breathing logo, using PropertySetu branding. */
export function AnimatedLoader({
  size,
  color = "var(--primary)",
  fullScreen = false,
  label = "Loading",
}: Props) {
  const diameter =
    typeof size === "number" ? Math.max(20, size) : size === "large" || fullScreen ? 112 : 28;
  const style = {
    "--loader-size": `${diameter}px`,
    "--loader-color": color,
    "--loader-border": diameter > 48 ? "2px" : "1.5px",
  } as CSSProperties;
  return (
    <div
      className={`property-loader ${fullScreen ? "property-loader-page" : ""}`}
      role="progressbar"
      aria-label={label}
      style={style}
    >
      <span className="property-loader-frame" aria-hidden="true">
        <span className="property-loader-pulse" />
        <span className="property-loader-track" />
        <span className="property-loader-ring" />
        <span className="property-loader-disc">
          <img src="/images/logo-emblem.png" alt="" />
        </span>
      </span>
    </div>
  );
}
