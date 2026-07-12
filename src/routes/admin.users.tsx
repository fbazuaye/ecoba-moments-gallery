import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Shield, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/admin/users")({ component: Users });

type Row = { id: string; email: string | null; full_name: string | null; roles: string[] };

function Users() {
  const qc = useQueryClient();
  const { isSuperAdmin, user } = useAuth();

  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("id,email,full_name");
      const { data: roles } = await supabase.from("user_roles").select("user_id,role");
      return (profiles ?? []).map<Row>((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      }));
    },
    enabled: isSuperAdmin,
  });

  async function setRole(uid: string, role: "admin" | "super_admin", add: boolean) {
    if (add) {
      await supabase.from("user_roles").insert({ user_id: uid, role });
    } else {
      await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    }
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-gold">Super Admin</div>
        <h1 className="font-display text-3xl">Users & Roles</h1>
        <p className="text-sm text-muted-foreground">Promote registered accounts to Admin or Super Admin. New sign-ups start as Viewers.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr><th className="p-3 text-left">User</th><th className="p-3 text-left">Roles</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data ?? []).map((u) => {
              const isAdm = u.roles.includes("admin");
              const isSup = u.roles.includes("super_admin");
              const isSelf = u.id === user?.id;
              return (
                <tr key={u.id}>
                  <td className="p-3">
                    <div className="font-medium">{u.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {isSup && <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-forest">Super Admin</span>}
                      {isAdm && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Admin</span>}
                      {!isSup && !isAdm && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Viewer</span>}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    {!isSelf && (
                      <div className="inline-flex gap-2">
                        <button onClick={() => setRole(u.id, "admin", !isAdm)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">
                          {isAdm ? <ShieldOff className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                          {isAdm ? "Remove Admin" : "Make Admin"}
                        </button>
                        <button onClick={() => setRole(u.id, "super_admin", !isSup)}
                          className="inline-flex items-center gap-1 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-xs text-forest hover:bg-gold/20">
                          {isSup ? "Revoke Super" : "Make Super"}
                        </button>
                      </div>
                    )}
                    {isSelf && <span className="text-xs text-muted-foreground">You</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
