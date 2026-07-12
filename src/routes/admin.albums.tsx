import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/albums")({ component: AdminAlbums });

const DAYS = [
  { id: "", label: "— None —" },
  { id: "10000000-0000-0000-0000-000000000001", label: "Friday, 17 July" },
  { id: "10000000-0000-0000-0000-000000000002", label: "Saturday, 18 July" },
  { id: "10000000-0000-0000-0000-000000000003", label: "Sunday, 19 July" },
];

function AdminAlbums() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dayId, setDayId] = useState("");

  const { data: albums } = useQuery({
    queryKey: ["admin-albums"],
    queryFn: async () => {
      const { data } = await supabase.from("albums").select("*").order("display_order");
      return data ?? [];
    },
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await supabase.from("albums").insert({
      event_id: "00000000-0000-0000-0000-000000000001",
      event_day_id: dayId || null,
      title, slug, description,
      display_order: (albums?.length ?? 0) + 10,
    });
    setTitle(""); setDescription(""); setDayId("");
    qc.invalidateQueries({ queryKey: ["admin-albums"] });
  }

  async function del(id: string) {
    if (!confirm("Delete this album? Its media will remain but be unassigned.")) return;
    await supabase.from("albums").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-albums"] });
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-gold">Admin</div>
        <h1 className="font-display text-3xl">Albums</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-border bg-card">
          <div className="divide-y divide-border">
            {(albums ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">/{a.slug}{a.description ? ` · ${a.description}` : ""}</div>
                </div>
                <button onClick={() => del(a.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={create} className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Create album</div>
          <div className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Album title" required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <select value={dayId} onChange={(e) => setDayId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {DAYS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
            <button className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
              <Plus className="h-4 w-4" /> Create album
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
