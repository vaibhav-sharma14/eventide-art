import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-hook";
import { useState } from "react";
import { CalendarDays, MapPin, Users, Ticket, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/events/$id")({
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [booking, setBooking] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, category:categories(name), organizer:profiles!events_organizer_id_fkey(full_name)")
        .eq("id", id)
        .single();
      return data;
    },
  });

  const { data: sold = 0 } = useQuery({
    queryKey: ["event-sold", id],
    queryFn: async () => {
      const { count } = await supabase.from("tickets").select("*", { count: "exact", head: true }).eq("event_id", id);
      return count ?? 0;
    },
  });

  async function book() {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!event) return;
    setBooking(true);
    try {
      const total = Number(event.price) * qty;
      const { data: bk, error: berr } = await supabase
        .from("bookings")
        .insert({ event_id: event.id, user_id: user.id, quantity: qty, total_amount: total })
        .select().single();
      if (berr) throw berr;

      const tickets = Array.from({ length: qty }).map(() => ({
        booking_id: bk.id, event_id: event.id, user_id: user.id,
        code: `EVT-${bk.id.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      }));
      const { error: terr } = await supabase.from("tickets").insert(tickets);
      if (terr) throw terr;

      await supabase.from("payments").insert({
        booking_id: bk.id, user_id: user.id, amount: total,
        provider: "stub", status: "paid", reference: `STUB-${Date.now()}`,
      });

      toast.success(`${qty} ticket${qty > 1 ? "s" : ""} booked!`);
      navigate({ to: "/tickets" });
    } catch (err: any) {
      toast.error(err.message ?? "Booking failed");
    } finally { setBooking(false); }
  }

  if (isLoading) return (
    <div className="min-h-screen bg-hero-grad"><Navbar /><div className="pt-32 max-w-5xl mx-auto px-6"><div className="glass rounded-2xl h-96 animate-pulse" /></div></div>
  );
  if (!event) return (
    <div className="min-h-screen bg-hero-grad"><Navbar /><div className="pt-32 text-center"><p>Event not found.</p><Link to="/events" className="text-brand-2">Browse events</Link></div></div>
  );

  const remaining = Math.max(0, event.capacity - sold);

  return (
    <div className="min-h-screen bg-hero-grad">
      <Navbar />
      <div className="pt-24 mx-auto max-w-6xl px-6 pb-16">
        <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden bg-gradient-to-br from-brand/40 via-brand-2/30 to-brand-3/30">
          {event.banner_url && <img src={event.banner_url} alt={event.title} className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <span className="glass rounded-full px-3 py-1 text-xs">{(event as any).category?.name ?? "Event"}</span>
            <h1 className="mt-3 font-display text-3xl md:text-5xl font-semibold">{event.title}</h1>
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display font-semibold text-xl">About this event</h2>
              <p className="mt-3 text-muted-foreground whitespace-pre-wrap leading-relaxed">{event.description || "No description provided."}</p>
            </div>
            {event.gallery && event.gallery.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h2 className="font-display font-semibold text-xl mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {event.gallery.map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="rounded-xl aspect-square object-cover" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="glass-strong rounded-2xl p-6 sticky top-24">
              <div className="flex items-baseline justify-between">
                <div className="font-display text-3xl font-semibold">
                  {Number(event.price) === 0 ? "Free" : `$${Number(event.price).toFixed(2)}`}
                </div>
                <div className="text-xs text-muted-foreground">{remaining} left</div>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-start gap-3"><CalendarDays className="h-4 w-4 mt-0.5 text-brand-2" />
                  <span>{new Date(event.starts_at).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}</span></div>
                <div className="flex items-start gap-3"><MapPin className="h-4 w-4 mt-0.5 text-brand-2" />
                  <span>{event.venue}{event.city ? `, ${event.city}` : ""}</span></div>
                <div className="flex items-start gap-3"><Users className="h-4 w-4 mt-0.5 text-brand-2" />
                  <span>Capacity {event.capacity}</span></div>
              </div>

              <div className="mt-6">
                <div className="text-xs text-muted-foreground mb-2">Quantity</div>
                <div className="flex items-center justify-between glass rounded-xl p-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/10"><Minus className="h-4 w-4" /></button>
                  <span className="font-display font-semibold">{qty}</span>
                  <button onClick={() => setQty(Math.min(remaining || 1, qty + 1))} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/10"><Plus className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-display font-semibold text-lg">${(Number(event.price) * qty).toFixed(2)}</span>
              </div>

              <Button
                onClick={book}
                disabled={booking || remaining === 0}
                className="btn-primary border-0 w-full mt-5 h-11 rounded-full"
              >
                <Ticket className="h-4 w-4 mr-1" />
                {remaining === 0 ? "Sold out" : booking ? "Processing…" : user ? "Book now" : "Sign in to book"}
              </Button>
              <p className="mt-3 text-[10px] text-muted-foreground text-center">Payment is stubbed for demo. Bookings are instantly confirmed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
