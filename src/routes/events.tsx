import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Browse events — Eventide" }] }),
  component: BrowsePage,
});

function BrowsePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", cat],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("id,title,banner_url,venue,city,starts_at,price,category_id,category:categories(name)")
        .eq("status", "published")
        .order("starts_at");
      if (cat) query = query.eq("category_id", cat);
      const { data } = await query;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(s) ||
        e.venue.toLowerCase().includes(s) ||
        (e.city ?? "").toLowerCase().includes(s),
    );
  }, [events, q]);

  return (
    <div className="min-h-screen bg-hero-grad">
      <Navbar />
      <div className="pt-32 pb-16 mx-auto max-w-7xl px-6">
        <h1 className="font-display text-4xl md:text-5xl font-semibold">Discover <span className="text-gradient">what's next</span></h1>
        <p className="mt-3 text-muted-foreground max-w-xl">Concerts, conferences, workshops — one place, thousands of possibilities.</p>

        <div className="mt-8 glass rounded-2xl p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, venue, city…" className="pl-9 h-11" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setCat(null)}
            className={`px-3 py-1.5 rounded-full text-xs transition ${!cat ? "btn-primary" : "glass"}`}
          >All</button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs transition ${cat === c.id ? "btn-primary" : "glass"}`}
            >{c.name}</button>
          ))}
        </div>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass rounded-2xl h-72 animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="col-span-full glass rounded-2xl p-16 text-center text-muted-foreground">No matching events.</div>
          ) : (
            filtered.map((e, i) => (
              <Link
                key={e.id}
                to="/events/$id"
                params={{ id: e.id }}
                className="glass rounded-2xl overflow-hidden hover:-translate-y-1 transition animate-rise"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="h-44 bg-gradient-to-br from-brand/40 via-brand-2/30 to-brand-3/30 relative">
                  {e.banner_url && <img src={e.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  <span className="absolute top-3 left-3 text-xs glass rounded-full px-2 py-1">{(e as any).category?.name ?? "Event"}</span>
                </div>
                <div className="p-5">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(e.starts_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
