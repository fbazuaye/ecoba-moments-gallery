import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Images } from "lucide-react";

export const Route = createFileRoute("/albums/")({ component: Albums });

function Albums() {
  const { data: albums } = useQuery({
    queryKey: ["albums-with-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("albums").select("*").order("display_order");
      const list = data ?? [];
      const counts = await Promise.all(list.map(async (a) => {
        const { count } = await supabase.from("media").select("*", { count: "exact", head: true })
          .eq("album_id", a.id).eq("status", "published");
        return { ...a, count: count ?? 0 };
      }));
      return counts;
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-gold">Albums</div>
        <h1 className="font-display text-4xl md:text-5xl">Curated collections</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Browse every album from the ECOBA NEC Meeting 2026, organised by event moment and activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(albums ?? []).map((a) => (
          <Link key={a.id} to="/albums/$slug" params={{ slug: a.slug }}
            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:shadow-elegant">
            <div className="relative aspect-[16/10] bg-gradient-to-br from-forest to-heritage">
              <div className="absolute inset-0 grid place-items-center text-gold/60">
                <Images className="h-12 w-12" />
              </div>
              <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs text-ivory backdrop-blur">
                {a.count} items
              </div>
              {a.featured && <div className="absolute right-3 top-3 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-forest">FEATURED</div>}
            </div>
            <div className="p-4">
              <h3 className="font-display text-xl">{a.title}</h3>
              {a.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>}
              {a.event_date && <div className="mt-2 text-xs uppercase tracking-widest text-gold">{new Date(a.event_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
