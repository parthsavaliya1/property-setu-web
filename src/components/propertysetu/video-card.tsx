import * as Dialog from "@radix-ui/react-dialog";
import { Film, Play, X } from "lucide-react";

export function PropertyVideoCard({ src, poster, index, onRemove, disabled = false }: {
  src: string;
  poster?: string | null;
  index: number;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return <Dialog.Root>
    <div className="ps-video-card">
      <Dialog.Trigger asChild>
        <button type="button" className="ps-video-card-open" aria-label={`Watch property video ${index + 1}`}>
          <span className="ps-video-card-poster">
            {poster ? <img src={poster} alt="" loading="lazy" /> : <Film size={36} aria-hidden="true" />}
            <span className="ps-video-card-play"><Play size={18} fill="currentColor" aria-hidden="true" /></span>
          </span>
          <span className="ps-video-card-caption"><strong>Property video</strong><small>Tap to watch</small></span>
        </button>
      </Dialog.Trigger>
      {onRemove && <button type="button" className="ps-video-card-remove" disabled={disabled} aria-label={`Remove video ${index + 1}`} onClick={onRemove}><X size={15} /></button>}
    </div>
    <Dialog.Portal>
      <Dialog.Overlay className="ps-video-dialog-overlay" />
      <Dialog.Content className="ps-video-dialog">
        <div className="ps-video-dialog-heading"><Dialog.Title>Property video</Dialog.Title><Dialog.Close asChild><button type="button" aria-label="Close video"><X size={22} /></button></Dialog.Close></div>
        <Dialog.Description className="sr-only">Watch this property's video. Use the player controls to pause or view fullscreen.</Dialog.Description>
        <video controls autoPlay playsInline src={src} preload="metadata" />
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
