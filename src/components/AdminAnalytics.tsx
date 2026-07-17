import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Globe2, Users, Eye, Activity, Smartphone, Monitor, Tablet } from "lucide-react";

type Row = {
  id: string;
  event_type: string;
  path: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  device_type: string | null;
  session_id: string | null;
  referrer: string | null;
  created_at: string;
};

const flag = (cc?: string | null) => {
  if (!cc || cc.length !== 2) return "🌐";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + (cc.toUpperCase().charCodeAt(0) - 65), A + (cc.toUpperCase().charCodeAt(1) - 65));
};

export function AdminAnalytics() {
  const [tick, setTick] = useState(0);

  // Real-time refresh trigger on any new analytics row
  useEffect(() => {
    const ch = supabase
      .channel("analytics-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_events" }, () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const { data } = useQuery({
    queryKey: ["admin-analytics", tick],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: rows } = await supabase
        .from("analytics_events")
        .select("id,event_type,path,country,city,region,device_type,session_id,referrer,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      return (rows ?? []) as Row[];
    },
    refetchInterval: 30_000,
  });

  const rows = data ?? [];

  const stats = useMemo(() => {
    const now = Date.now();
    const day = now - 24 * 60 * 60 * 1000;
    const activeCut = now - 5 * 60 * 1000;
    const views = rows.filter((r) => r.event_type === "page_view");
    const views24 = views.filter((r) => new Date(r.created_at).getTime() >= day);
    const uniqueSessions = new Set(views.map((r) => r.session_id).filter(Boolean)).size;
    const active = new Set(rows.filter((r) => new Date(r.created_at).getTime() >= activeCut).map((r) => r.session_id).filter(Boolean)).size;

    const byCountry = new Map<string, { name: string; code: string | null; count: number }>();
    for (const r of views) {
      const key = r.country || "Unknown";
      const cur = byCountry.get(key) ?? { name: key, code: r.country, count: 0 };
      cur.count++;
      byCountry.set(key, cur);
    }
    const countries = [...byCountry.values()].sort((a, b) => b.count - a.count).slice(0, 8);

    const byCity = new Map<string, number>();
    for (const r of views) {
      if (!r.city) continue;
      const k = `${r.city}${r.country ? ", " + r.country : ""}`;
      byCity.set(k, (byCity.get(k) ?? 0) + 1);
    }
    const cities = [...byCity.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    const byPath = new Map<string, number>();
    for (const r of views) {
      const p = r.path || "/";
      byPath.set(p, (byPath.get(p) ?? 0) + 1);
    }
    const paths = [...byPath.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    const devices = { mobile: 0, desktop: 0, tablet: 0 };
    for (const r of views) {
      const d = (r.device_type as keyof typeof devices) ?? "desktop";
      if (d in devices) devices[d]++;
    }

    // last 14 days series
    const series: { day: string; views: number; visitors: number }[] = [];
    const dayMap = new Map<string, { views: number; sessions: Set<string> }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { views: 0, sessions: new Set() });
    }
    for (const r of views) {
      const key = r.created_at.slice(0, 10);
      const b = dayMap.get(key);
      if (!b) continue;
      b.views++;
      if (r.session_id) b.sessions.add(r.session_id);
    }
    for (const [key, v] of dayMap.entries()) {
      series.push({ day: key.slice(5), views: v.views, visitors: v.sessions.size });
    }

    const engagement = {
      photo_view: rows.filter((r) => r.event_type === "photo_view").length,
      video_play: rows.filter((r) => r.event_type === "video_play").length,
      download: rows.filter((r) => r.event_type === "download").length,
      share: rows.filter((r) => r.event_type === "share").length,
    };

    return {
      totalViews: views.length,
      views24: views24.length,
      uniqueSessions,
      active,
      countries,
      cities,
      paths,
      devices,
      series,
      engagement,
      recent: rows.slice(0, 12),
    };
  }, [rows]);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-2xl">Live analytics</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> real-time
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Active now (5 min)", value: stats.active, icon: Activity },
          { label: "Visitors (30d)", value: stats.uniqueSessions, icon: Users },
          { label: "Page views (24h)", value: stats.views24, icon: Eye },
          { label: "Countries", value: stats.countries.filter((c) => c.name !== "Unknown").length, icon: Globe2 },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><k.icon className="h-3.5 w-3.5" /> {k.label}</div>
            <div className="mt-2 font-display text-3xl">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="mb-3 font-display text-lg">Visits & visitors — last 14 days</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.series}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#07583F" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="visitors" stroke="#E9B83F" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-lg">Devices</h3>
          <div className="space-y-3">
            {[
              { k: "mobile", icon: Smartphone, label: "Mobile" },
              { k: "desktop", icon: Monitor, label: "Desktop" },
              { k: "tablet", icon: Tablet, label: "Tablet" },
            ].map((d) => {
              const v = stats.devices[d.k as "mobile" | "desktop" | "tablet"];
              const total = stats.devices.mobile + stats.devices.desktop + stats.devices.tablet || 1;
              const pct = Math.round((v / total) * 100);
              const Icon = d.icon;
              return (
                <div key={d.k}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /> {d.label}</div>
                    <div className="text-muted-foreground">{v} · {pct}%</div>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <h4 className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Engagement (30d)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-muted/40 p-2"><div className="text-xs text-muted-foreground">Photo views</div><div className="font-display text-xl">{stats.engagement.photo_view}</div></div>
              <div className="rounded-lg bg-muted/40 p-2"><div className="text-xs text-muted-foreground">Video plays</div><div className="font-display text-xl">{stats.engagement.video_play}</div></div>
              <div className="rounded-lg bg-muted/40 p-2"><div className="text-xs text-muted-foreground">Downloads</div><div className="font-display text-xl">{stats.engagement.download}</div></div>
              <div className="rounded-lg bg-muted/40 p-2"><div className="text-xs text-muted-foreground">Shares</div><div className="font-display text-xl">{stats.engagement.share}</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-lg">Top countries</h3>
          {stats.countries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No geo data yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.countries.map((c) => {
                const max = stats.countries[0].count || 1;
                const pct = Math.round((c.count / max) * 100);
                return (
                  <li key={c.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><span className="text-base">{flag(c.code)}</span>{c.name}</span>
                      <span className="text-muted-foreground">{c.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-lg">Top cities</h3>
          {stats.cities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No city data yet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {stats.cities.map((c) => (
                <li key={c.name} className="flex items-center justify-between">
                  <span className="truncate">{c.name}</span>
                  <span className="text-muted-foreground">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-lg">Top pages</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.paths} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={110} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#07583F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg">Live visitor feed</h3>
          <span className="text-xs text-muted-foreground">updates in real-time</span>
        </div>
        <div className="divide-y divide-border">
          {stats.recent.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Waiting for the first visitor…</p>}
          {stats.recent.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-base">{flag(r.country)}</span>
                <span className="truncate">
                  <span className="font-medium">{r.event_type}</span>
                  <span className="text-muted-foreground"> · {r.path || "/"}</span>
                </span>
              </div>
              <div className="shrink-0 text-xs text-muted-foreground">
                {[r.city, r.country].filter(Boolean).join(", ") || "—"} · {new Date(r.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
