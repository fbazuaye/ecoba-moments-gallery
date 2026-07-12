import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: Auth });

function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: isAdmin ? "/admin" : "/" });
  }, [user, isAdmin, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-hero px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-elegant">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="h-16 w-16" />
          <h1 className="mt-4 font-display text-2xl">ECOBA MOMENTS</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Administrator Access</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input value={fullName} onChange={(e) => setName(e.target.value)} required
              placeholder="Full name" className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold" />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email"
            placeholder="Email address" className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password"
            placeholder="Password" minLength={6}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold" />
          {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
          <button disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>New here? <button onClick={() => setMode("signup")} className="text-primary hover:underline">Create an account</button></>
          ) : (
            <>Already registered? <button onClick={() => setMode("signin")} className="text-primary hover:underline">Sign in</button></>
          )}
          <div className="mt-3 rounded-lg bg-muted p-3 text-left text-[11px] leading-relaxed">
            <strong>Note:</strong> New accounts start as <em>Viewers</em>. Only a Super Admin can grant Admin or Super Admin roles from the Super Admin console.
          </div>
        </div>
      </div>
    </div>
  );
}
