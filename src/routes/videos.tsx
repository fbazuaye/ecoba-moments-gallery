import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { MediaGrid, type MediaItem } from "@/components/MediaGrid";
import { Lightbox } from "@/components/Lightbox";

export const Route = createFileRoute("/videos")({ component: Videos });

function Videos() {
  const [idx, setIdx] = useState<number | null>(null);
  const { data } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data } = await supabase.from("media").select("*")
        .eq("media_type", "video").eq("status", "published").order("uploaded_at", { ascending: false });
      return (data ?? []) as MediaItem[];
    },
  });
  const items = data ?? [];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-gold">Videos</div>
        <h1 className="font-display text-4xl md:text-5xl">Watch the moments</h1>
      </div>
      <MediaGrid items={items} onOpen={setIdx} />
      {idx !== null && <Lightbox items={items} index={idx} onClose={() => setIdx(null)} onIndex={setIdx} />}
    </div>
  );
}
