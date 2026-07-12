import { createFileRoute } from "@tanstack/react-router";
import { Crown, Users, Sparkles, Sun } from "lucide-react";

export const Route = createFileRoute("/programme")({ component: Programme });

const DAYS = [
  {
    date: "Friday, 17 July 2026",
    title: "Arrival & Royal Courtesy",
    icon: Users,
    items: [
      { time: "All Day", label: "Arrival of Delegates", desc: "Delegates arrive in Warri and check in to their accommodations." },
      { time: "5:00 PM", label: "Royal Courtesy Visit", desc: "Courtesy visit to HRM Albert Akpomudje SAN, FCIArb, Eyanvwien-Alaka I, Ohworode of Olomu Kingdom, at his residence." },
    ],
  },
  {
    date: "Saturday, 18 July 2026",
    title: "NEC Meeting & Gala Night",
    icon: Sparkles,
    items: [
      { time: "9:00 AM", label: "NEC Meeting", desc: "Official National Executive Committee meeting." },
      { time: "6:00 PM", label: "Gala Night", desc: "Elegant celebration of ECOBA fellowship, awards and entertainment." },
    ],
  },
  {
    date: "Sunday, 19 July 2026",
    title: "Farewell & Departure",
    icon: Sun,
    items: [
      { time: "Morning", label: "Farewell", desc: "Final gatherings and group photographs." },
      { time: "Throughout", label: "Departure", desc: "Delegates depart Warri with memories to last a lifetime." },
    ],
  },
];

function Programme() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs uppercase tracking-widest text-forest">
          <Crown className="h-3.5 w-3.5 text-gold" /> Official Programme
        </div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">ECOBA NEC Meeting 2026</h1>
        <p className="mt-2 text-muted-foreground">Warri Branch · 17–19 July 2026</p>
      </div>

      <div className="relative space-y-8">
        <div className="absolute left-6 top-0 bottom-0 hidden w-px bg-gradient-to-b from-gold via-gold/40 to-transparent md:block" />
        {DAYS.map((d, i) => (
          <div key={i} className="relative rounded-3xl border border-border bg-card p-6 shadow-soft md:pl-16">
            <div className="absolute left-0 top-6 hidden h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elegant md:flex">
              <d.icon className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <d.icon className="h-5 w-5 text-gold" />
              <div className="text-xs uppercase tracking-widest text-gold">{d.date}</div>
            </div>
            <div className="hidden text-xs uppercase tracking-widest text-gold md:block">{d.date}</div>
            <h2 className="mt-1 font-display text-2xl">{d.title}</h2>
            <div className="mt-4 space-y-3">
              {d.items.map((it, j) => (
                <div key={j} className="flex gap-4 border-t border-border pt-3">
                  <div className="w-24 shrink-0 font-semibold text-primary">{it.time}</div>
                  <div>
                    <div className="font-semibold">{it.label}</div>
                    <div className="text-sm text-muted-foreground">{it.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
