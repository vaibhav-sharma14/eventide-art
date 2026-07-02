import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hook";
import { Navbar } from "@/components/Navbar";
import { Users, CalendarDays, Ticket, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const [users, organizers, events, tickets, payments, recent] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "organizer"),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("tickets").select("*", { count: "exact", head: true }),
        supabase.from("payments").select("amount"),
        supabase.from("bookings").select("id,quantity,total_amount,created_at,event:events(title),user:profiles!bookings_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(10),
      ]);
      return {
        users: users.count ?? 0,
        organizers: organizers.count ?? 0,
        events: events.count ?? 0,
        tickets: tickets.count ?? 0,
        revenue: (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0),
        recent: recent.data ?? [],
      };
    },
  });

  if (!isAdmin) return (
    <div className="min-h-screen bg-hero-grad"><Navbar /><div className="pt-40 text-center text-muted-foreground">Admin access required.</div></div>
  );

  return (
    <div className="min-h-screen bg-hero-grad">
      <Navbar />
      <div className="pt-32 pb-16 mx-auto max-w-7xl px-6">
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Admin overview</h1>
        <p className="text-muted-foreground mt-2">Platform-wide health at a glance.</p>

        <div className="mt-8 grid md:grid-cols-4 gap-4">
          <Stat icon={Users} label="Total users" value={String(stats?.users ?? 0)} />
          <Stat icon={Users} label="Organizers" value={String(stats?.organizers ?? 0)} />
          <Stat icon={CalendarDays} label="Events" value={String(stats?.events ?? 0)} />
          <Stat icon={Ticket} label="Tickets" value={String(stats?.tickets ?? 0)} />
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <Stat icon={DollarSign} label="Total revenue" value={`$${(stats?.revenue ?? 0).toFixed(2)}`} />
        </div>

        <div className="mt-10 glass rounded-2xl p-6 overflow-x-auto">
          <h2 className="font-display font-semibold text-lg mb-4">Recent bookings</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground text-xs uppercase">
              <tr><th className="pb-3">User</th><th>Event</th><th>Qty</th><th>Total</th><th>When</th></tr>
            </thead>
            <tbody>
              {(stats?.recent ?? []).map((b: any) => (
                <tr key={b.id} className="border-t border-border/40">
                  <td className="py-3">{b.user?.full_name ?? "—"}</td>
                  <td>{b.event?.title}</td>
                  <td>{b.quantity}</td>
                  <td>${Number(b.total_amount).toFixed(2)}</td>
                  <td className="text-muted-foreground">{new Date(b.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {(stats?.recent ?? []).length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No bookings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="glass rounded-2xl p-6">
      <Icon className="h-5 w-5 text-brand-2" />
      <div className="mt-3 font-display text-3xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
