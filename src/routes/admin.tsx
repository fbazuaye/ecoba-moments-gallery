import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { LayoutDashboard, Upload, Images, Layers, QrCode, Users, LogOut, ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, isAdmin, isSuperAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) return <div className="grid min-h-dvh place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-6">
        <div className="max-w-md rounded-2xl bg-card p-8 text-center shadow-elegant">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">!</div>
          <h1 className="font-display text-2xl">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">You need Admin permissions to access this area. Contact a Super Admin to request access.</p>
          <Link to="/" className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Back to gallery</Link>
        </div>
      </div>
    );
  }

  const links = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/upload", label: "Upload Media", icon: Upload },
    { to: "/admin/media", label: "Media Library", icon: Images },
    { to: "/admin/albums", label: "Albums", icon: Layers },
    { to: "/admin/qr", label: "QR Code", icon: QrCode },
    ...(isSuperAdmin ? [{ to: "/admin/users", label: "Users & Roles", icon: Users }] : []),
  ];

  return (
    <div className="min-h-dvh bg-secondary">
      <div className="grid min-h-dvh lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-border bg-card">
          <div className="p-5"><Logo className="h-12 w-12" showText /></div>
          <div className="px-5 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Admin Console</div>
          <nav className="space-y-0.5 px-3 pb-6">
            {links.map((l) => {
              const active = l.exact ? location.pathname === l.to : location.pathname.startsWith(l.to);
              return (
                <Link key={l.to} to={l.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  <l.icon className="h-4 w-4" /> {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-2 border-t border-border p-4 text-xs">
            <div className="truncate font-medium">{user.email}</div>
            <div className="text-muted-foreground">{isSuperAdmin ? "Super Admin" : "Admin"}</div>
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> View public site</Link>
            <button onClick={() => signOut()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
          </div>
        </aside>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
