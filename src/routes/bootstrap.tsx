import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";

export const Route = createFileRoute("/bootstrap")({ component: Bootstrap });

function Bootstrap() {
  const { user } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function claim() {
    setLoading(true);
    const { data, error } = await supabase.rpc("claim_first_super_admin");
    setLoading(false);
    if (error) setMsg(error.message);
    else if (data === "ok") setMsg("Success! You are now Super Admin. Please refresh the page.");
    else if (data === "already_claimed") setMsg("A Super Admin already exists. Ask them to grant you access.");
    else if (data === "not_signed_in") setMsg("Sign in first.");
    else setMsg(String(data));
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-hero p-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-elegant">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-gold-gradient text-forest"><Crown className="h-6 w-6" /></div>
        <h1 className="font-display text-2xl">Claim Super Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This one-time bootstrap grants the very first signed-in user the Super Admin role. It stops working as soon as any Super Admin exists.
        </p>
        {!user ? (
          <Link to="/auth" className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Sign in first</Link>
        ) : (
          <button onClick={claim} disabled={loading}
            className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {loading ? "Working…" : `Claim as ${user.email}`}
          </button>
        )}
        {msg && <div className="mt-4 rounded-lg bg-muted p-3 text-sm">{msg}</div>}
      </div>
    </div>
  );
}
