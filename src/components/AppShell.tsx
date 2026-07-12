import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";
import { AiAssistant } from "./AiAssistant";
import { Home, Images, Layers, Video, Calendar, Star, Sparkles, LogIn, LogOut, Shield, Menu, X } from "lucide-react";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/gallery", label: "Gallery", icon: Images },
  { to: "/albums", label: "Albums", icon: Layers },
  { to: "/videos", label: "Videos", icon: Video },
  { to: "/programme", label: "Programme", icon: Calendar },
  { to: "/featured", label: "Featured", icon: Star },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const router = useRouter();
  const { user, isAdmin, signOut } = useAuth();
  const [aiOpen, setAiOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="p-6">
          <Link to="/" className="block"><Logo className="h-14 w-14" showText /></Link>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => {
            const active = location.pathname === n.to || (n.to !== "/" && location.pathname.startsWith(n.to));
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground shadow-soft" : "text-foreground/70 hover:bg-muted"
                }`}>
                <Icon className="h-4 w-4" />{n.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin"
              className={`mt-4 flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2.5 text-sm font-semibold text-forest transition hover:bg-gold/20`}>
              <Shield className="h-4 w-4 text-gold" /> Admin Console
            </Link>
          )}
        </nav>
        <div className="border-t border-border p-4 text-xs text-muted-foreground">
          {user ? (
            <div className="space-y-2">
              <div className="truncate font-medium text-foreground">{user.email}</div>
              <button onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          ) : (
            <Link to="/auth" className="flex items-center gap-2 hover:text-foreground">
              <LogIn className="h-3.5 w-3.5" /> Admin sign in
            </Link>
          )}
          <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Since 1937 · Warri 2026
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/"><Logo className="h-10 w-10" /></Link>
        <div className="font-display text-base font-semibold">ECOBA MOMENTS</div>
        <button onClick={() => setMobileNav(true)} aria-label="Menu" className="p-2">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {mobileNav && (
        <div className="fixed inset-0 z-50 bg-forest/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between p-4">
            <Logo className="h-10 w-10" />
            <button onClick={() => setMobileNav(false)} className="text-ivory" aria-label="Close"><X /></button>
          </div>
          <nav className="mt-6 flex flex-col gap-1 px-6">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setMobileNav(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-lg text-ivory hover:bg-white/10">
                <n.icon className="h-5 w-5 text-gold" /> {n.label}
              </Link>
            ))}
            {isAdmin && <Link to="/admin" onClick={() => setMobileNav(false)}
              className="mt-4 flex items-center gap-3 rounded-lg bg-gold px-3 py-3 text-lg text-forest">
              <Shield className="h-5 w-5" /> Admin Console</Link>}
            {!user && <Link to="/auth" onClick={() => setMobileNav(false)}
              className="mt-4 flex items-center gap-3 rounded-lg border border-gold/40 px-3 py-3 text-lg text-ivory">
              <LogIn className="h-5 w-5 text-gold" /> Admin sign in</Link>}
            {user && <button onClick={async () => { await signOut(); setMobileNav(false); }}
              className="mt-4 flex items-center gap-3 rounded-lg border border-white/20 px-3 py-3 text-lg text-ivory">
              <LogOut className="h-5 w-5" /> Sign out</button>}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className={`min-h-dvh ${isAdminRoute ? "" : "pb-20 lg:pb-0"} lg:pl-64 ${aiOpen ? "xl:pr-96" : ""}`}>
        {children}
      </main>

      {/* AI Assistant panel (desktop right sidebar) */}
      {!isAdminRoute && (
        <>
          <aside className={`fixed inset-y-0 right-0 z-30 hidden w-96 border-l border-border bg-card transition-transform xl:flex xl:flex-col ${
            aiOpen ? "translate-x-0" : "translate-x-full"
          }`}>
            <AiAssistant onClose={() => setAiOpen(false)} />
          </aside>
          {!aiOpen && (
            <button onClick={() => setAiOpen(true)}
              className="fixed bottom-24 right-6 z-30 hidden items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elegant xl:flex">
              <Sparkles className="h-4 w-4 text-gold" /> Ask ECOBA AI
            </button>
          )}
        </>
      )}

      {/* Mobile bottom nav */}
      {!isAdminRoute && (
        <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card/95 py-2 backdrop-blur lg:hidden">
          {[
            { to: "/", label: "Home", icon: Home },
            { to: "/gallery", label: "Gallery", icon: Images },
            { to: "/albums", label: "Albums", icon: Layers },
            { to: "/programme", label: "Programme", icon: Calendar },
          ].map((n) => {
            const active = location.pathname === n.to;
            return (
              <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
                <n.icon className="h-5 w-5" />{n.label}
              </Link>
            );
          })}
          <button onClick={() => setAiOpen(true)} className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] text-primary">
            <Sparkles className="h-5 w-5 text-gold" /> AI
          </button>
        </nav>
      )}

      {/* Mobile / tablet AI sheet */}
      {aiOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAiOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 top-16 rounded-t-3xl bg-card shadow-elegant">
            <AiAssistant onClose={() => setAiOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
