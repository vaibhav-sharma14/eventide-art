import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hook";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Trash2, Pencil, CalendarDays, DollarSign, Users, Ticket, ScanLine } from "lucide-react";

export const Route = createFileRoute("/_authenticated/organizer")({
  component: OrganizerPage,
});

function OrganizerPage() {
  const { user, isOrganizer } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const { data: events = [], refetch } = useQuery({
    queryKey: ["organizer-events", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("events").select("*").eq("organizer_id", user!.id).order("starts_at", { ascending: false })).data ?? [],
  });

  const { data: analytics } = useQuery({
    queryKey: ["organizer-analytics", user?.id, events.map((e) => e.id).join()],
    enabled: !!user && events.length > 0,
    queryFn: async () => {
      const eventIds = events.map((e) => e.id);
      const [tk, pm] = await Promise.all([
        supabase.from("tickets").select("id,checked_in,event_id").in("event_id", eventIds),
        supabase.from("payments").select("amount,booking_id,booking:bookings(event_id)").in("booking.event_id", eventIds),
      ]);
      const tickets = tk.data ?? [];
      const revenue = (pm.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
      const checked = tickets.filter((t) => t.checked_in).length;
      return { tickets: tickets.length, checked, revenue, tk: tickets };
    },
  });

  if (!isOrganizer) {
    return (
      <div className="min-h-screen bg-hero-grad">
        <Navbar />
        <div className="pt-40 text-center">
          <p className="text-muted-foreground">You need organizer access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-grad">
      <Navbar />
      <div className="pt-32 pb-16 mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold">Organizer</h1>
            <p className="text-muted-foreground mt-2">Manage your events and track performance.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-full"><Link to="/organizer/scan"><ScanLine className="h-4 w-4 mr-1" /> Check-in</Link></Button>
            <Button className="btn-primary border-0 rounded-full" onClick={() => { setEditId(null); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" /> New event</Button>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-4 gap-4">
          <Stat icon={CalendarDays} label="Events" value={events.length.toString()} />
          <Stat icon={Ticket} label="Tickets sold" value={String(analytics?.tickets ?? 0)} />
          <Stat icon={Users} label="Attended" value={String(analytics?.checked ?? 0)} />
          <Stat icon={DollarSign} label="Revenue" value={`$${(analytics?.revenue ?? 0).toFixed(2)}`} />
        </div>

        {showForm && (
          <EventForm
            categories={categories}
            userId={user!.id}
            editId={editId}
            existing={events.find((e) => e.id === editId)}
            onDone={() => { setShowForm(false); setEditId(null); refetch(); }}
            onCancel={() => { setShowForm(false); setEditId(null); }}
          />
        )}

        <div className="mt-8 glass rounded-2xl p-6 overflow-x-auto">
          <h2 className="font-display font-semibold text-lg mb-4">Your events</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground text-xs uppercase">
              <tr><th className="pb-3">Title</th><th>Date</th><th>Venue</th><th>Price</th><th>Capacity</th><th></th></tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-border/40">
                  <td className="py-3"><Link to="/events/$id" params={{ id: e.id }} className="hover:text-brand-2">{e.title}</Link></td>
                  <td>{new Date(e.starts_at).toLocaleDateString()}</td>
                  <td>{e.venue}</td>
                  <td>${Number(e.price).toFixed(2)}</td>
                  <td>{e.capacity}</td>
                  <td className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditId(e.id); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={async () => {
                      if (!confirm("Delete this event?")) return;
                      const { error } = await supabase.from("events").delete().eq("id", e.id);
                      if (error) toast.error(error.message); else { toast.success("Deleted"); refetch(); }
                    }}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan={6} className="py-6 text-muted-foreground text-center">No events yet — create your first one.</td></tr>}
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

function EventForm({ categories, userId, editId, existing, onDone, onCancel }: any) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [venue, setVenue] = useState(existing?.venue ?? "");
  const [city, setCity] = useState(existing?.city ?? "");
  const [startsAt, setStartsAt] = useState(existing ? new Date(existing.starts_at).toISOString().slice(0, 16) : "");
  const [price, setPrice] = useState(String(existing?.price ?? "0"));
  const [capacity, setCapacity] = useState(String(existing?.capacity ?? "100"));
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? "");
  const [banner, setBanner] = useState<File | null>(null);
  const [gallery, setGallery] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  async function upload(file: File) {
    const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-]/gi, "_")}`;
    const { error } = await supabase.storage.from("event-media").upload(path, file);
    if (error) throw error;
    const { data } = await supabase.storage.from("event-media").createSignedUrl(path, 60 * 60 * 24 * 365);
    return data?.signedUrl ?? "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let banner_url = existing?.banner_url ?? null;
      if (banner) banner_url = await upload(banner);
      let gallery_urls: string[] = existing?.gallery ?? [];
      if (gallery) {
        const uploaded = await Promise.all(Array.from(gallery).map(upload));
        gallery_urls = [...gallery_urls, ...uploaded];
      }
      const payload = {
        organizer_id: userId,
        title, description, venue, city,
        starts_at: new Date(startsAt).toISOString(),
        price: Number(price), capacity: Number(capacity),
        category_id: categoryId || null,
        banner_url, gallery: gallery_urls,
      };
      const { error } = editId
        ? await supabase.from("events").update(payload).eq("id", editId)
        : await supabase.from("events").insert(payload);
      if (error) throw error;
      toast.success(editId ? "Event updated" : "Event created");
      onDone();
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="mt-8 glass-strong rounded-2xl p-6 space-y-4">
      <h2 className="font-display font-semibold text-lg">{editId ? "Edit event" : "Create event"}</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} /></div>
        <div>
          <Label>Category</Label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
            <option value="">— select —</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div><Label>Venue</Label><Input value={venue} onChange={(e) => setVenue(e.target.value)} required /></div>
        <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
        <div><Label>Start</Label><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Price</Label><Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          <div><Label>Capacity</Label><Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></div>
        </div>
      </div>
      <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000} /></div>
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>Banner image</Label><Input type="file" accept="image/*" onChange={(e) => setBanner(e.target.files?.[0] ?? null)} /></div>
        <div><Label>Gallery images</Label><Input type="file" accept="image/*" multiple onChange={(e) => setGallery(e.target.files)} /></div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="btn-primary border-0 rounded-full">{saving ? "Saving…" : "Save event"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
