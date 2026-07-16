import { useEffect, useState, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Download, Share2, Loader2 } from "lucide-react";
import { signedUrl } from "@/lib/media-utils";
import type { MediaItem } from "./MediaGrid";
import { supabase } from "@/integrations/supabase/client";

export function Lightbox({ items, index, onClose, onIndex }: {
  items: MediaItem[]; index: number; onClose: () => void; onIndex: (i: number) => void;
}) {
  const item = items[index];
  const [url, setUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    setUrl("");
    setPosterUrl("");
    const target = item.optimised_url || item.original_url;
    signedUrl(target).then(setUrl);
    if (item.thumbnail_url) signedUrl(item.thumbnail_url).then(setPosterUrl);
    supabase.from("analytics_events").insert({
      event_type: item.media_type === "video" ? "video_play" : "photo_view",
      media_id: item.id,
    });
  }, [item]);

  // Preload neighbours for smoother swiping
  useEffect(() => {
    const neighbours = [items[(index + 1) % items.length], items[(index - 1 + items.length) % items.length]];
    neighbours.forEach((n) => {
      if (!n) return;
      const p = n.thumbnail_url || n.optimised_url || n.original_url;
      if (p) signedUrl(p);
    });
  }, [index, items]);

  const prev = useCallback(() => onIndex((index - 1 + items.length) % items.length), [index, items.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % items.length), [index, items.length, onIndex]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === " " && item?.media_type === "video" && videoRef.current) {
        e.preventDefault();
        if (videoRef.current.paused) videoRef.current.play(); else videoRef.current.pause();
      }
    };
    window.addEventListener("keydown", h);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", h); };
  }, [prev, next, onClose, item]);

  async function share() {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: item.title ?? "ECOBA Moment", url: shareUrl }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
    supabase.from("analytics_events").insert({ event_type: "share", media_id: item.id });
  }

  async function download() {
    const a = document.createElement("a");
    a.href = url; a.download = item.title || "ecoba-moment";
    a.target = "_blank"; a.rel = "noopener";
    a.click();
    supabase.from("analytics_events").insert({ event_type: "download", media_id: item.id });
  }

  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[oklch(0.08_0.005_150)]">
      <div className="flex items-center justify-between p-4 text-ivory">
        <div className="min-w-0">
          <div className="truncate font-display text-lg">{item.title ?? "ECOBA Moment"}</div>
          <div className="truncate text-xs text-ivory/60">
            {item.photographer ? `📸 ${item.photographer} · ` : ""}{index + 1} of {items.length}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={share} className="rounded-full p-2 text-ivory hover:bg-white/10" aria-label="Share"><Share2 className="h-5 w-5" /></button>
          <button onClick={download} className="rounded-full p-2 text-ivory hover:bg-white/10" aria-label="Download"><Download className="h-5 w-5" /></button>
          <button onClick={onClose} className="rounded-full p-2 text-ivory hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2">
        <button onClick={prev} className="absolute left-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-ivory hover:bg-white/20" aria-label="Previous"><ChevronLeft /></button>
        {loading && (
          <div className="absolute inset-0 z-0 grid place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-ivory/70" />
          </div>
        )}
        {url && (item.media_type === "video"
          ? <video
              ref={videoRef}
              key={item.id}
              src={url}
              poster={posterUrl || undefined}
              controls
              autoPlay
              playsInline
              preload="metadata"
              controlsList="nodownload"
              onLoadedData={() => setLoading(false)}
              onCanPlay={() => setLoading(false)}
              onClick={(e) => {
                const v = e.currentTarget;
                if (v.paused) v.play(); else v.pause();
              }}
              className="max-h-full max-w-full object-contain"
            />
          : <img
              key={item.id}
              src={url}
              alt={item.title ?? ""}
              onLoad={() => setLoading(false)}
              className="max-h-full max-w-full object-contain"
            />)}
        <button onClick={next} className="absolute right-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-ivory hover:bg-white/20" aria-label="Next"><ChevronRight /></button>
      </div>
      {item.caption && <div className="mx-auto max-w-3xl px-6 py-4 text-center text-sm text-ivory/80">{item.caption}</div>}
    </div>
  );
}
