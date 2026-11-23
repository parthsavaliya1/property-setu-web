export type MediaSettings = {
  maxPhotos: number;
  maxVideos: number;
  maxVideoDurationSeconds: number;
  photoMaxEdge: number;
  photoQuality: number;
  photoTargetKb: number;
  videoMaxEdge: number;
  videoQuality: "high" | "balanced" | "compact";
};
export const defaultMediaSettings: MediaSettings = {
  maxPhotos: 29, maxVideos: 1, maxVideoDurationSeconds: 60,
  photoMaxEdge: 720, photoQuality: 85, photoTargetKb: 60,
  videoMaxEdge: 480, videoQuality: "compact",
};

export function videoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const cleanup = () => { clearTimeout(timer); video.removeAttribute("src"); URL.revokeObjectURL(url); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("Could not read video duration. Try a different file.")); }, 15000);
    video.preload = "metadata";
    video.onloadedmetadata = () => { const duration = video.duration; cleanup(); if (Number.isFinite(duration) && duration > 0) resolve(duration); else reject(new Error("Could not read video duration.")); };
    video.onerror = () => { cleanup(); reject(new Error("Could not read this video. Try an MP4 file.")); };
    video.src = url;
  });
}
