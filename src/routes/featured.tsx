import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { MediaGrid, type MediaItem } from "@/components/MediaGrid";
import { Lightbox } from "@/components/Lightbox";
import { Star } from "lucide-react";

export const Route = createFileRoute("/featured")({ component: Featured });

function Featured() {
  const [idx, setIdx] = useState<number | null>(null);
  const { data } = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data } = await supabase.from("media").select("*")
        .eq("featured", true).eq("status", "published").order("uploaded_at", { ascending: false });
      return (data ?? []) as MediaItem[];
    },
  });
  const items = data ?? [];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-gold-gradient text-forest"><Star className="h-5 w-5" /></div>
        <div>
          <div className="text-xs uppercase tracking-widest text-gold">Featured</div>
          <h1 className="font-display text-4xl md:text-5xl">Editors' picks</h1>
        </div>
      </div>
      <MediaGrid items={items} onOpen={setIdx} />
      {idx !== null && <Lightbox items={items} index={idx} onClose={() => setIdx(null)} onIndex={setIdx} />}
    </div>
  );
}
