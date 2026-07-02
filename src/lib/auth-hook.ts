import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "organizer" | "user";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      if (data.session?.user) await loadRoles(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) await loadRoles(session.user.id);
      else setRoles([]);
    });
    async function loadRoles(uid: string) {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
    }
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const has = (r: AppRole) => roles.includes(r);
  return { user, loading, roles, isAdmin: has("admin"), isOrganizer: has("organizer") || has("admin"), signOut: () => supabase.auth.signOut() };
}
