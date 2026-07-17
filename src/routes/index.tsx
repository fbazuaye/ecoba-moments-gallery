import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { MediaGrid, type MediaItem } from "@/components/MediaGrid";
import { Lightbox } from "@/components/Lightbox";
import { Logo } from "@/components/Logo";
import { Calendar, Images, Layers, Video, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const stats = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [{ count: photos }, { count: videos }, { count: albums }, { count: days }] = await Promise.all([
        supabase.from("media").select("*", { count: "exact", head: true }).eq("media_type", "photo").eq("status", "published"),
        supabase.from("media").select("*", { count: "exact", head: true }).eq("media_type", "video").eq("status", "published"),
        supabase.from("albums").select("*", { count: "exact", head: true }),
        supabase.from("event_days").select("*", { count: "exact", head: true }),
      ]);
      return { photos: photos ?? 0, videos: videos ?? 0, albums: albums ?? 0, days: days ?? 0 };
    },
  });

  const latest = useQuery({
    queryKey: ["home-latest"],
    queryFn: async () => {
      const { data } = await supabase.from("media").select("*")
        .eq("status", "published").eq("featured", true)
        .order("uploaded_at", { ascending: false }).limit(12);
      return (data ?? []) as MediaItem[];
    },
  });

  const [lightIdx, setLightIdx] = useState<number | null>(null);
  const items = latest.data ?? [];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero text-ivory">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_60%,var(--gold)_0,transparent_50%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 md:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> ECOBA NEC 2026 · Warri Branch
            </div>
            <h1 className="font-display text-5xl leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
              ECOBA <span className="text-gold">Moments</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-ivory/80 md:text-xl">
              Gather. Connect. Celebrate. Remember. The official photo & video experience for the ECOBA NEC Meeting 2026 · 17–19 July 2026.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/gallery" className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-forest shadow-elegant transition hover:brightness-105">
                Explore Event Gallery <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/programme" className="inline-flex items-center gap-2 rounded-full border border-ivory/30 px-6 py-3 text-sm font-semibold text-ivory hover:bg-white/10">
                View Programme
              </Link>
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <div className="relative rounded-3xl border border-gold/30 bg-white/5 p-10 backdrop-blur">
              <Logo className="h-40 w-40" />
              <div className="mt-6 text-center font-display text-lg text-gold">Bridging Memories, Building Futures</div>
              <div className="text-center text-xs uppercase tracking-[0.3em] text-ivory/60">Since 1937</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto -mt-8 max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 shadow-elegant md:grid-cols-4 md:gap-6 md:p-6">
          {[
            { label: "Photos", value: stats.data?.photos ?? "—", icon: Images },
            { label: "Videos", value: stats.data?.videos ?? "—", icon: Video },
            { label: "Albums", value: stats.data?.albums ?? "—", icon: Layers },
            { label: "Event Days", value: stats.data?.days ?? "—", icon: Calendar },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold/15 text-forest"><s.icon className="h-5 w-5" /></div>
              <div>
                <div className="font-display text-2xl leading-none">{s.value}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LATEST */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-gold">Latest</div>
            <h2 className="font-display text-3xl md:text-4xl">Fresh moments</h2>
          </div>
          <Link to="/gallery" className="text-sm font-medium text-primary hover:underline">View all →</Link>
        </div>
        <MediaGrid items={items} onOpen={setLightIdx} />
      </section>

      {/* JOURNEY */}
      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-gold">Event Journey</div>
          <h2 className="font-display text-3xl md:text-4xl">Three days of ECOBA fellowship</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { to: "/gallery?day=friday", tag: "Friday · 17 July", title: "Arrival & Royal Courtesy Visit", copy: "Delegates arrive in Warri; evening courtesy visit to HRM the Ohworode of Olomu Kingdom." },
            { to: "/gallery?day=saturday", tag: "Saturday · 18 July", title: "NEC Meeting & Gala Night", copy: "9:00 AM official NEC Meeting. 6:00 PM Gala Night celebration." },
            { to: "/gallery?day=sunday", tag: "Sunday · 19 July", title: "Farewell & Departure", copy: "Final group photographs, farewells, and delegate departures." },
          ].map((d) => (
            <Link key={d.to} to={d.to} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:border-gold/50 hover:shadow-elegant">
              <div className="text-xs uppercase tracking-widest text-gold">{d.tag}</div>
              <h3 className="mt-2 font-display text-2xl">{d.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{d.copy}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Open gallery <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI callout */}
      <section className="mx-auto mb-16 max-w-7xl px-6">
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-forest px-8 py-10 text-ivory md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
              <Sparkles className="h-3.5 w-3.5" /> Ask ECOBA AI
            </div>
            <h3 className="font-display text-2xl md:text-3xl">Your intelligent event concierge</h3>
            <p className="mt-2 max-w-lg text-ivory/70">Ask about the programme, find pictures from the Gala Night, or discover the latest moments — instantly.</p>
          </div>
          <Link to="/gallery" className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-forest">Try it now</Link>
        </div>
      </section>

      {lightIdx !== null && <Lightbox items={items} index={lightIdx} onClose={() => setLightIdx(null)} onIndex={setLightIdx} />}
    </div>
  );
}
