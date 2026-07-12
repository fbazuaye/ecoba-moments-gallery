import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { MediaGrid, type MediaItem } from "@/components/MediaGrid";
import { Lightbox } from "@/components/Lightbox";
import { Search } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  day: z.enum(["friday", "saturday", "sunday"]).optional(),
  album: z.string().optional(),
  filter: z.enum(["all", "photos", "videos", "featured"]).optional(),
  sort: z.enum(["newest", "oldest", "views", "featured"]).optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/gallery")({
  component: Gallery,
  validateSearch: (s) => searchSchema.parse(s),
});

const DAY_MAP: Record<string, string> = {
  friday: "10000000-0000-0000-0000-000000000001",
  saturday: "10000000-0000-0000-0000-000000000002",
  sunday: "10000000-0000-0000-0000-000000000003",
};

function Gallery() {
  const search = useSearch({ from: "/gallery" });
  const navigate = Route.useNavigate();
  const [lightIdx, setLightIdx] = useState<number | null>(null);
  const [q, setQ] = useState(search.q ?? "");

  const filter = search.filter ?? "all";
  const sort = search.sort ?? "newest";

  const media = useQuery({
    queryKey: ["gallery", search],
    queryFn: async () => {
      let query = supabase.from("media").select("*").eq("status", "published");
      if (search.day) query = query.eq("event_day_id", DAY_MAP[search.day]);
      if (search.album) query = query.eq("album_id", search.album);
      if (filter === "photos") query = query.eq("media_type", "photo");
      if (filter === "videos") query = query.eq("media_type", "video");
      if (filter === "featured") query = query.eq("featured", true);
      if (sort === "newest") query = query.order("uploaded_at", { ascending: false });
      else if (sort === "oldest") query = query.order("uploaded_at", { ascending: true });
      else if (sort === "views") query = query.order("view_count", { ascending: false });
      else query = query.order("featured", { ascending: false }).order("uploaded_at", { ascending: false });
      const { data } = await query.limit(300);
      return (data ?? []) as MediaItem[];
    },
  });

  const items = useMemo(() => {
    const list = media.data ?? [];
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter((m) =>
      (m.title ?? "").toLowerCase().includes(needle) ||
      (m.caption ?? "").toLowerCase().includes(needle) ||
      (m.photographer ?? "").toLowerCase().includes(needle),
    );
  }, [media.data, q]);

  const filterChips = [
    { k: "all", label: "All Moments" },
    { k: "photos", label: "Photos" },
    { k: "videos", label: "Videos" },
    { k: "featured", label: "Featured" },
  ] as const;

  const dayChips = [
    { k: undefined, label: "All Days" },
    { k: "friday" as const, label: "Friday" },
    { k: "saturday" as const, label: "Saturday" },
    { k: "sunday" as const, label: "Sunday" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-gold">Event Gallery</div>
        <h1 className="font-display text-4xl md:text-5xl">Every Moment, Remembered</h1>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles, captions, photographers…"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30" />
        </div>
        <select value={sort} onChange={(e) => navigate({ search: (s: z.infer<typeof searchSchema>) => ({ ...s, sort: e.target.value as "newest" | "oldest" | "views" | "featured" }) })}
          className="rounded-full border border-border bg-card px-4 py-2.5 text-sm">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="views">Most Viewed</option>
          <option value="featured">Featured</option>
        </select>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {dayChips.map((c) => {
          const active = (search.day ?? undefined) === c.k;
          return (
            <button key={String(c.k)}
              onClick={() => navigate({ search: (s: z.infer<typeof searchSchema>) => ({ ...s, day: c.k }) })}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                active ? "border-gold bg-gold text-forest" : "border-border bg-card hover:border-gold/50"
              }`}>{c.label}</button>
          );
        })}
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {filterChips.map((c) => {
          const active = filter === c.k;
          return (
            <button key={c.k}
              onClick={() => navigate({ search: (s: z.infer<typeof searchSchema>) => ({ ...s, filter: c.k }) })}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"
              }`}>{c.label}</button>
          );
        })}
      </div>

      {media.isLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 15 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : (
        <MediaGrid items={items} onOpen={setLightIdx} />
      )}

      {lightIdx !== null && <Lightbox items={items} index={lightIdx} onClose={() => setLightIdx(null)} onIndex={setLightIdx} />}
    </div>
  );
}
