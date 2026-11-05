import { useExplorerLanguage } from "./language";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useProduct } from "./context";

export function MobilePageHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string | undefined;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const app = useProduct();
  const { text } = useExplorerLanguage();
  return (
    <div className="xp-native-header">
      <button
        type="button"
        className="xp-native-back"
        aria-label="Back"
        onClick={onBack || (() => app.go("home"))}
      >
        <ArrowLeft size={18} />
      </button>
      <div>
        <h1>{text(title)}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {right || <span className="xp-native-header-spacer" />}
    </div>
  );
}
