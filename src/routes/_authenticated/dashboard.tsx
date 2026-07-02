import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hook";
import { Navbar } from "@/components/Navbar";
import { Ticket, Wallet, CalendarClock, User as UserIcon, ScanLine, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isOrganizer, isAdmin } = useAuth();

  const { data: tickets = [] } = useQuery({
    queryKey: ["my-tickets", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("tickets").select("id,checked_in,event:events(title,starts_at)").eq("user_id", user!.id)).data ?? [],
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["my-payments", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("payments").select("amount,created_at,status").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const upcoming = tickets.filter((t) => new Date((t as any).event?.starts_at) > new Date()).length;
  const spent = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="min-h-screen bg-hero-grad">
      <Navbar />
      <div className="pt-32 pb-16 mx-auto max-w-7xl px-6">
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Your dashboard</h1>
        <p className="text-muted-foreground mt-2">Everything you've booked, paid, and are looking forward to.</p>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Stat icon={Ticket} label="Tickets" value={tickets.length.toString()} />
          <Stat icon={CalendarClock} label="Upcoming" value={upcoming.toString()} />
          <Stat icon={Wallet} label="Total spent" value={`$${spent.toFixed(2)}`} />
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-4">
          <QuickLink to="/tickets" icon={Ticket} title="My Tickets" desc="View passes & QR codes" />
          <QuickLink to="/profile" icon={UserIcon} title="Profile" desc="Manage your info" />
          {isOrganizer && <QuickLink to="/organizer" icon={ScanLine} title="Organizer" desc="Events & analytics" />}
          {isAdmin && <QuickLink to="/admin" icon={ShieldCheck} title="Admin" desc="Platform overview" />}
        </div>

        <div className="mt-10 glass rounded-2xl p-6">
          <h2 className="font-display font-semibold text-lg">Recent payments</h2>
          <div className="mt-4 divide-y divide-border/40">
            {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
            {payments.slice(0, 6).map((p, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                <span className="uppercase text-xs text-brand-2">{p.status}</span>
                <span className="font-display font-semibold">${Number(p.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
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

function QuickLink({ to, icon: Icon, title, desc }: any) {
  return (
    <Link to={to} className="glass rounded-2xl p-6 hover:-translate-y-1 transition block">
      <Icon className="h-5 w-5 text-brand" />
      <div className="mt-3 font-display font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}
