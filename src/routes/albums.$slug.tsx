import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { MediaGrid, type MediaItem } from "@/components/MediaGrid";
import { Lightbox } from "@/components/Lightbox";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/albums/$slug")({ component: AlbumDetail });

function AlbumDetail() {
  const { slug } = Route.useParams();
  const [idx, setIdx] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ["album", slug],
    queryFn: async () => {
      const { data: album } = await supabase.from("albums").select("*").eq("slug", slug).maybeSingle();
      if (!album) return { album: null, items: [] as MediaItem[] };
      const { data: items } = await supabase.from("media").select("*")
        .eq("album_id", album.id).eq("status", "published").order("uploaded_at", { ascending: false });
      return { album, items: (items ?? []) as MediaItem[] };
    },
  });

  if (data && !data.album) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="font-display text-3xl">Album not found</h1>
      <Link to="/albums" className="mt-4 inline-block text-primary hover:underline">← Back to albums</Link>
    </div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Link to="/albums" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All albums
      </Link>
      <div className="my-6">
        <div className="text-xs uppercase tracking-widest text-gold">Album</div>
        <h1 className="font-display text-4xl md:text-5xl">{data?.album?.title ?? "Loading…"}</h1>
        {data?.album?.description && <p className="mt-2 max-w-2xl text-muted-foreground">{data.album.description}</p>}
      </div>
      <MediaGrid items={data?.items ?? []} onOpen={setIdx} />
      {idx !== null && data && <Lightbox items={data.items} index={idx} onClose={() => setIdx(null)} onIndex={setIdx} />}
    </div>
  );
}
