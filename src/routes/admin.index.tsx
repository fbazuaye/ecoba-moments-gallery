import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Images, Video, Layers, Eye, Download, Share2, Upload, QrCode, Plus } from "lucide-react";
import { AdminAnalytics } from "@/components/AdminAnalytics";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: photos }, { count: videos }, { count: albums }, views, downloads, shares] = await Promise.all([
        supabase.from("media").select("*", { count: "exact", head: true }).eq("media_type", "photo"),
        supabase.from("media").select("*", { count: "exact", head: true }).eq("media_type", "video"),
        supabase.from("albums").select("*", { count: "exact", head: true }),
        supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "photo_view"),
        supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "download"),
        supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "share"),
      ]);
      const { data: latest } = await supabase.from("media").select("id,title,uploaded_at,media_type,album_id").order("uploaded_at", { ascending: false }).limit(6);
      return {
        photos: photos ?? 0, videos: videos ?? 0, albums: albums ?? 0,
        views: views.count ?? 0, downloads: downloads.count ?? 0, shares: shares.count ?? 0,
        latest: latest ?? [],
      };
    },
  });

  const s = data;
  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold">Admin</div>
          <h1 className="font-display text-3xl md:text-4xl">Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/upload" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Upload className="h-4 w-4" /> Upload Media</Link>
          <Link to="/admin/albums" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm"><Plus className="h-4 w-4" /> Create Album</Link>
          <Link to="/admin/qr" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm"><QrCode className="h-4 w-4" /> Event QR</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Photos", value: s?.photos, icon: Images },
          { label: "Videos", value: s?.videos, icon: Video },
          { label: "Albums", value: s?.albums, icon: Layers },
          { label: "Views", value: s?.views, icon: Eye },
          { label: "Downloads", value: s?.downloads, icon: Download },
          { label: "Shares", value: s?.shares, icon: Share2 },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><k.icon className="h-3.5 w-3.5" /> {k.label}</div>
            <div className="mt-2 font-display text-3xl">{k.value ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Recent uploads</h2>
        <div className="mt-4 divide-y divide-border">
          {(s?.latest ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 text-sm">
              <div className="min-w-0"><div className="truncate">{m.title ?? "Untitled"}</div>
                <div className="text-xs text-muted-foreground">{m.media_type} · {new Date(m.uploaded_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {(s?.latest ?? []).length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No uploads yet. Get started →</div>}
        </div>
      </div>

      <AdminAnalytics />
    </div>
    </div>
  );
}
