import { useEffect, useState } from "react";
import { signedUrl } from "@/lib/media-utils";
import { Play, Star } from "lucide-react";

export type MediaItem = {
  id: string;
  media_type: "photo" | "video";
  thumbnail_url: string | null;
  optimised_url: string | null;
  original_url: string;
  title: string | null;
  caption: string | null;
  photographer: string | null;
  featured: boolean;
  duration: number | null;
  album_id: string | null;
};

export function MediaGrid({ items, onOpen }: { items: MediaItem[]; onOpen: (i: number) => void }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gold/20" />
        <h3 className="font-display text-xl">No moments yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">Photos and videos will appear here once uploaded by the event photography team.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((m, i) => <MediaTile key={m.id} item={m} onClick={() => onOpen(i)} />)}
    </div>
  );
}

function MediaTile({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  const [url, setUrl] = useState<string>("");
  const isVideo = item.media_type === "video";
  const hasImageThumb = !!(item.thumbnail_url || (!isVideo && (item.optimised_url || item.original_url)));

  useEffect(() => {
    const path = hasImageThumb
      ? (item.thumbnail_url || item.optimised_url || item.original_url)
      : (isVideo ? (item.optimised_url || item.original_url) : item.original_url);
    signedUrl(path).then(setUrl);
  }, [item, hasImageThumb, isVideo]);

  return (
    <button onClick={onClick}
      className={`group relative aspect-square overflow-hidden rounded-xl bg-muted shadow-soft transition hover:shadow-elegant ${item.featured ? "ring-2 ring-gold" : ""}`}>
      {url ? (
        isVideo && !hasImageThumb ? (
          <video
            src={`${url}#t=0.5`}
            preload="metadata"
            muted
            playsInline
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <img src={url} alt={item.title ?? "ECOBA moment"} loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )
      ) : <div className="h-full w-full animate-pulse bg-muted" />}
      {isVideo && (
        <div className="absolute inset-0 grid place-items-center bg-black/30">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white/95 text-forest"><Play className="h-5 w-5" /></div>
        </div>
      )}
      {item.featured && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-forest">
          <Star className="h-3 w-3" /> Featured
        </div>
      )}
    </button>
  );
}

