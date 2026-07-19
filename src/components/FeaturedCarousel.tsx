import { useEffect, useRef, useState } from "react";
import { signedUrl } from "@/lib/media-utils";
import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import type { MediaItem } from "@/components/MediaGrid";

export function FeaturedCarousel({ items, onOpen }: { items: MediaItem[]; onOpen: (i: number) => void }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const tile = el.querySelector<HTMLElement>("[data-tile]");
    const step = tile ? tile.offsetWidth + 12 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        aria-label="Scroll left"
        onClick={() => scrollBy(-1)}
        className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:grid h-11 w-11 place-items-center rounded-full bg-white text-forest shadow-elegant ring-1 ring-border hover:bg-gold hover:text-forest"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Scroll right"
        onClick={() => scrollBy(1)}
        className="absolute right-0 top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 md:grid h-11 w-11 place-items-center rounded-full bg-white text-forest shadow-elegant ring-1 ring-border hover:bg-gold hover:text-forest"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((m, i) => (
          <CarouselTile key={m.id} item={m} onClick={() => onOpen(i)} />
        ))}
      </div>
    </div>
  );
}

function CarouselTile({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  const [url, setUrl] = useState("");
  const isVideo = item.media_type === "video";
  const thumbPath = item.thumbnail_url || (!isVideo ? (item.optimised_url || item.original_url) : "");
  const videoFallbackPath = isVideo && !thumbPath ? (item.optimised_url || item.original_url) : "";

  useEffect(() => {
    const path = thumbPath || videoFallbackPath;
    if (!path) return;
    signedUrl(path).then(setUrl);
  }, [thumbPath, videoFallbackPath]);

  return (
    <button
      data-tile
      onClick={onClick}
      className={`group relative aspect-[4/5] w-60 shrink-0 snap-start overflow-hidden rounded-2xl bg-muted shadow-soft transition hover:-translate-y-1 hover:shadow-elegant md:w-72 ${item.featured ? "ring-2 ring-gold" : ""}`}
    >
      {url ? (
        thumbPath ? (
          <img
            src={url}
            alt={item.title ?? "ECOBA moment"}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <video
            src={`${url}#t=0.5`}
            preload="metadata"
            muted
            playsInline
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )
      ) : (
        <div className="h-full w-full animate-pulse bg-muted" />
      )}

      {isVideo && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-gradient-to-t from-black/50 via-transparent to-transparent">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-forest shadow-lg">
            <Play className="h-6 w-6" fill="currentColor" />
          </div>
        </div>
      )}

      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-forest">
        <Star className="h-3 w-3" /> Featured
      </div>

      {(item.title || item.caption) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-ivory">
          {item.title && <div className="line-clamp-1 font-display text-sm">{item.title}</div>}
          {item.caption && <div className="line-clamp-1 text-[11px] text-ivory/80">{item.caption}</div>}
        </div>
      )}
    </button>
  );
}
