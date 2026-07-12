import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { MediaGrid, type MediaItem } from "@/components/MediaGrid";
import { Lightbox } from "@/components/Lightbox";
import { Star, Trash2, EyeOff, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/media")({ component: MediaLibrary });

function MediaLibrary() {
  const qc = useQueryClient();
  const [idx, setIdx] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["admin-media"],
    queryFn: async () => {
      const { data } = await supabase.from("media").select("*").order("uploaded_at", { ascending: false }).limit(500);
      return (data ?? []) as MediaItem[];
    },
  });
  const items = (data ?? []).filter((m) => !q || (m.title ?? "").toLowerCase().includes(q.toLowerCase()));

  async function toggleFeature(id: string, val: boolean) {
    await supabase.from("media").update({ featured: val }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-media"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this item permanently?")) return;
    await supabase.from("media").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-media"] });
  }
  async function togglePublish(id: string, cur: string) {
    const next = cur === "published" ? "hidden" : "published";
    await supabase.from("media").update({ status: next }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-media"] });
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold">Admin</div>
          <h1 className="font-display text-3xl">Media Library</h1>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm" />
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No media uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((m, i) => (
            <div key={m.id} className="group relative overflow-hidden rounded-xl border border-border bg-card">
              <button onClick={() => setIdx(i)} className="block w-full">
                <div className="aspect-square bg-muted" />
              </button>
              <div className="p-2">
                <div className="truncate text-xs">{m.title ?? "Untitled"}</div>
              </div>
              <div className="absolute inset-x-0 top-0 flex justify-end gap-1 bg-gradient-to-b from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => toggleFeature(m.id, !m.featured)}
                  title="Feature" className={`grid h-8 w-8 place-items-center rounded-full ${m.featured ? "bg-gold text-forest" : "bg-white/90 text-forest"}`}>
                  <Star className="h-4 w-4" />
                </button>
                <button onClick={() => togglePublish(m.id, (m as MediaItem & { status: string }).status ?? "published")}
                  title="Publish/Hide" className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-forest">
                  {((m as MediaItem & { status: string }).status ?? "published") === "published" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => del(m.id)} title="Delete" className="grid h-8 w-8 place-items-center rounded-full bg-destructive text-destructive-foreground">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {idx !== null && <Lightbox items={items} index={idx} onClose={() => setIdx(null)} onIndex={setIdx} />}
    </div>
  );
}
