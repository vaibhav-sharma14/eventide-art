import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hook";
import { Navbar } from "@/components/Navbar";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CalendarDays, MapPin, CheckCircle2, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tickets")({
  component: TicketsPage,
});

function TicketsPage() {
  const { user } = useAuth();
  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase
        .from("tickets")
        .select("id,code,checked_in,checked_in_at,event:events(id,title,venue,city,starts_at,banner_url)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
      ).data ?? [],
  });

  return (
    <div className="min-h-screen bg-hero-grad">
      <Navbar />
      <div className="pt-32 pb-16 mx-auto max-w-6xl px-6">
        <h1 className="font-display text-3xl md:text-4xl font-semibold">My tickets</h1>
        <p className="text-muted-foreground mt-2">Present the QR code at the entrance.</p>

        <div className="mt-8 grid md:grid-cols-2 gap-5">
          {tickets.length === 0 && <p className="col-span-full text-muted-foreground">No tickets yet.</p>}
          {tickets.map((t) => (
            <TicketCard key={t.id} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TicketCard({ t }: { t: any }) {
  const [dataUrl, setDataUrl] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(t.code, { margin: 1, width: 220, color: { dark: "#111", light: "#ffffff" } }).then(setDataUrl);
  }, [t.code]);
  const e = t.event;
  const download = () => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${t.code}.png`;
    a.click();
  };
  return (
    <div className="glass-strong rounded-2xl overflow-hidden">
      <div className="h-32 bg-gradient-to-br from-brand/40 via-brand-2/30 to-brand-3/30 relative">
        {e?.banner_url && <img src={e.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      </div>
      <div className="p-5 flex gap-5">
        <div className="flex-1">
          <h3 className="font-display font-semibold">{e?.title}</h3>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {new Date(e?.starts_at).toLocaleString()}</div>
          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {e?.venue}{e?.city ? `, ${e.city}` : ""}</div>
          <div className="mt-3 font-mono text-xs bg-black/30 px-2 py-1 rounded inline-block">{t.code}</div>
          <div className="mt-3">
            {t.checked_in ? (
              <span className="inline-flex items-center gap-1 text-xs text-brand-2"><CheckCircle2 className="h-3.5 w-3.5" /> Checked in</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">Awaiting scan</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          {dataUrl && <img src={dataUrl} alt="QR" className="h-28 w-28 rounded-lg bg-white p-1" />}
          <button onClick={download} className="text-xs text-brand-2 inline-flex items-center gap-1"><Download className="h-3 w-3" /> Save</button>
        </div>
      </div>
    </div>
  );
}
