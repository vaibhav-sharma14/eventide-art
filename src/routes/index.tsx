import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Sparkles, Ticket, QrCode, BarChart3, ShieldCheck, ArrowRight, Zap, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function useCountUp(end: number, ms = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setN(Math.floor(p * end));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, ms]);
  return n;
}

function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth, h = window.innerHeight;
      setMouse({ x: (e.clientX / w - 0.5) * 2, y: (e.clientY / h - 0.5) * 2 });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const { data: events = [] } = useQuery({
    queryKey: ["landing-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id,title,banner_url,venue,city,starts_at,price,category:categories(name)")
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(6);
      return data ?? [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const [ev, bk] = await Promise.all([
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("tickets").select("*", { count: "exact", head: true }),
      ]);
      return { events: ev.count ?? 0, tickets: bk.count ?? 0 };
    },
  });

  const eventsCount = useCountUp(Math.max(stats?.events ?? 0, 240));
  const ticketsCount = useCountUp(Math.max(stats?.tickets ?? 0, 12800));
  const citiesCount = useCountUp(48);
  const satisfaction = useCountUp(99);

  return (
    <div className="min-h-screen bg-hero-grad text-foreground overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section ref={heroRef} className="relative pt-32 pb-24 min-h-[92vh] flex items-center">
        {/* Blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-20 -left-20 h-[32rem] w-[32rem] rounded-full bg-brand/30 blur-3xl animate-blob" />
          <div className="absolute top-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-brand-2/25 blur-3xl animate-blob" style={{ animationDelay: "-4s" }} />
          <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-brand-3/20 blur-3xl animate-blob" style={{ animationDelay: "-8s" }} />
        </div>
        {/* Floating shapes */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white/10 animate-floaty"
              style={{
                width: `${6 + (i % 5) * 4}px`,
                height: `${6 + (i % 5) * 4}px`,
                left: `${(i * 53) % 100}%`,
                top: `${(i * 37) % 100}%`,
                animationDelay: `${(i % 6) * 0.8}s`,
                animationDuration: `${5 + (i % 4)}s`,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-brand-2" />
              The premium event platform
            </span>
            <h1 className="mt-6 font-display text-5xl md:text-7xl font-semibold leading-[1.05]">
              Host events that <span className="text-gradient">feel unforgettable.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Eventide unifies discovery, ticketing, QR check-in, and analytics — a single stage for organizers and attendees to meet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="btn-primary border-0 rounded-full h-12 px-6 text-base">
                <Link to="/events">Explore events <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-6 text-base border-border/50">
                <Link to="/auth">Start hosting</Link>
              </Button>
            </div>

            <div className="mt-14 grid grid-cols-4 gap-6 max-w-lg">
              {[
                { n: eventsCount, l: "Events", suf: "+" },
                { n: ticketsCount.toLocaleString(), l: "Tickets", suf: "" },
                { n: citiesCount, l: "Cities", suf: "" },
                { n: satisfaction, l: "Rating", suf: "%" },
              ].map((s, i) => (
                <div key={i} className="animate-rise" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                  <div className="font-display text-2xl md:text-3xl font-semibold">{s.n}{s.suf}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3D-feel floating card cluster */}
          <div className="relative h-[520px] hidden lg:block">
            <div
              className="absolute inset-0 grid place-items-center"
              style={{ transform: `translate3d(${mouse.x * 12}px, ${mouse.y * 12}px, 0)`, transition: "transform .2s ease-out" }}
            >
              <div className="glass-strong rounded-3xl p-6 w-[340px] shadow-2xl animate-floaty">
                <div className="h-40 rounded-2xl bg-gradient-to-br from-brand/60 via-brand-2/40 to-brand-3/50" />
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Sat · Nov 21</div>
                    <div className="font-display font-semibold">Aurora Sound</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">from</div>
                    <div className="font-display font-semibold">$29</div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="absolute top-10 -right-6 glass rounded-2xl p-4 w-56 animate-floaty"
              style={{ animationDelay: "-2s", transform: `translate3d(${mouse.x * -20}px, ${mouse.y * -20}px, 0)` }}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><QrCode className="h-4 w-4 text-brand-2" />QR Check-in</div>
              <div className="mt-2 h-16 w-16 rounded-md bg-white/90 grid grid-cols-6 gap-[2px] p-1">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className={`rounded-[1px] ${Math.random() > 0.45 ? "bg-black" : "bg-transparent"}`} />
                ))}
              </div>
            </div>
            <div
              className="absolute bottom-10 -left-4 glass rounded-2xl p-4 w-60 animate-floaty"
              style={{ animationDelay: "-4s", transform: `translate3d(${mouse.x * -15}px, ${mouse.y * 20}px, 0)` }}
            >
              <div className="text-xs text-muted-foreground">This week</div>
              <div className="mt-1 font-display font-semibold">Revenue</div>
              <div className="mt-3 flex items-end gap-1 h-16">
                {[30, 55, 40, 75, 60, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-brand-2 to-brand" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div
              className="absolute -top-2 left-8 animate-drift text-xs glass rounded-full px-3 py-1"
              style={{ transform: `translate3d(${mouse.x * 30}px, 0, 0)` }}
            >
              <Zap className="inline h-3 w-3 mr-1 text-brand-3" /> 128 tickets sold today
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl md:text-5xl font-semibold">Everything you need to <span className="text-gradient">run the room.</span></h2>
            <p className="mt-4 text-muted-foreground">From the first invite to the final applause — one platform, quietly powerful.</p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Ticket, t: "Instant Ticketing", d: "Sell tickets in seconds with beautifully branded pages." },
              { icon: QrCode, t: "QR Check-in", d: "Unique codes per ticket. Scan, verify, welcome." },
              { icon: BarChart3, t: "Live Analytics", d: "Revenue, attendance and pipeline in real time." },
              { icon: ShieldCheck, t: "Role-based Access", d: "Admins, organizers, attendees — perfectly scoped." },
              { icon: Users, t: "Team Ready", d: "Multiple organizers, staff, and secure permissions." },
              { icon: Sparkles, t: "Beautiful by default", d: "Every touchpoint feels considered — because it is." },
            ].map((f, i) => (
              <div key={i} className="glass rounded-2xl p-6 group hover:-translate-y-1 transition animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="h-11 w-11 rounded-xl grid place-items-center btn-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display font-semibold text-lg">{f.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="py-24 relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-semibold">Upcoming <span className="text-gradient">on Eventide</span></h2>
              <p className="mt-3 text-muted-foreground">Hand-picked events happening soon.</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:inline-flex"><Link to="/events">Browse all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          {events.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              <p className="text-muted-foreground">No events yet — be the first to host one.</p>
              <Button asChild className="mt-6 btn-primary border-0"><Link to="/auth">Become an organizer</Link></Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((e, i) => (
                <Link
                  key={e.id}
                  to="/events/$id"
                  params={{ id: e.id }}
                  className="glass rounded-2xl overflow-hidden hover:-translate-y-1 transition animate-rise"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="h-44 bg-gradient-to-br from-brand/40 via-brand-2/30 to-brand-3/30 relative">
                    {e.banner_url && <img src={e.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                    <span className="absolute top-3 left-3 text-xs glass rounded-full px-2 py-1">{(e as any).category?.name ?? "Event"}</span>
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(e.starts_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                    <h3 className="mt-2 font-display font-semibold text-lg leading-tight">{e.title}</h3>
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" /> {e.venue}{e.city ? `, ${e.city}` : ""}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-display font-semibold">{Number(e.price) === 0 ? "Free" : `$${Number(e.price).toFixed(2)}`}</span>
                      <span className="text-xs text-brand-2">View →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="glass-strong rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand/40 blur-3xl" />
            <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-brand-2/40 blur-3xl" />
            <h3 className="font-display text-3xl md:text-5xl font-semibold max-w-2xl">Ready to make your next event <span className="text-gradient">the one people remember?</span></h3>
            <p className="mt-4 text-muted-foreground max-w-lg">Free to start. No credit card. Cancel anytime.</p>
            <div className="mt-8 flex gap-3">
              <Button asChild size="lg" className="btn-primary border-0 rounded-full h-12 px-6"><Link to="/auth">Create account</Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-6"><Link to="/events">See live events</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Eventide</span>
          <span>Crafted with care.</span>
        </div>
      </footer>
    </div>
  );
}
