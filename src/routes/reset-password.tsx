import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash and emits PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });
    // Also check for existing session (link already parsed)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setOk(true);
      setTimeout(() => navigate({ to: "/auth" }), 2000);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-hero px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-elegant">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="h-16 w-16" />
          <h1 className="mt-4 font-display text-2xl">Set a new password</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">ECOBA MOMENTS</p>
        </div>
        {ok ? (
          <div className="rounded-lg bg-primary/10 p-4 text-center text-sm text-primary">
            Password updated. Redirecting to sign in…
          </div>
        ) : !ready ? (
          <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
            Waiting for reset link… Open this page from the password reset email.
            <div className="mt-3">
              <Link to="/auth" className="text-primary hover:underline">Back to sign in</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password"
              placeholder="New password" minLength={6}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold" />
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} required type="password"
              placeholder="Confirm new password" minLength={6}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold" />
            {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
            <button disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
