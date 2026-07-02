import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hook";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Camera, CameraOff } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export const Route = createFileRoute("/_authenticated/organizer/scan")({
  component: ScanPage,
});

function ScanPage() {
  const { user, isOrganizer } = useAuth();
  const [code, setCode] = useState("");
  const [last, setLast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function checkIn(rawCode: string) {
    if (!rawCode || !user) return;
    const clean = rawCode.trim();
    const { data: ticket, error } = await supabase.from("tickets")
      .select("id,checked_in,event:events(title,organizer_id)")
      .eq("code", clean).maybeSingle();

    if (error || !ticket) { setLast({ ok: false, msg: "Invalid ticket code" }); return; }
    if ((ticket as any).event?.organizer_id !== user.id) {
      setLast({ ok: false, msg: "Not your event" }); return;
    }
    if (ticket.checked_in) { setLast({ ok: false, msg: "Already checked in" }); return; }

    const { error: uerr } = await supabase.from("tickets")
      .update({ checked_in: true, checked_in_at: new Date().toISOString(), checked_in_by: user.id })
      .eq("id", ticket.id);
    if (uerr) { setLast({ ok: false, msg: uerr.message }); return; }

    setLast({ ok: true, msg: `Checked in — ${(ticket as any).event.title}` });
    toast.success("Ticket checked in");
    setCode("");
  }

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  async function toggleCamera() {
    if (scanning) {
      await scannerRef.current?.stop();
      scannerRef.current = null;
      setScanning(false);
      return;
    }
    const q = new Html5Qrcode("qr-reader");
    scannerRef.current = q;
    try {
      await q.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decoded) => { checkIn(decoded); },
        () => {},
      );
      setScanning(true);
    } catch (e: any) {
      toast.error("Camera unavailable — use manual entry");
    }
  }

  if (!isOrganizer) return (
    <div className="min-h-screen bg-hero-grad"><Navbar /><div className="pt-40 text-center text-muted-foreground">Organizer access required.</div></div>
  );

  return (
    <div className="min-h-screen bg-hero-grad">
      <Navbar />
      <div className="pt-32 pb-16 mx-auto max-w-2xl px-6">
        <h1 className="font-display text-3xl font-semibold">Check-in</h1>
        <p className="text-muted-foreground mt-2">Scan a QR code or enter it manually.</p>

        <div className="mt-8 glass-strong rounded-2xl p-6">
          <div id="qr-reader" className="rounded-xl overflow-hidden" />
          <Button onClick={toggleCamera} variant="outline" className="mt-4 rounded-full w-full">
            {scanning ? <><CameraOff className="h-4 w-4 mr-2" />Stop camera</> : <><Camera className="h-4 w-4 mr-2" />Start camera</>}
          </Button>

          <div className="mt-6 border-t border-border/40 pt-6">
            <div className="text-xs text-muted-foreground mb-2">Manual entry</div>
            <div className="flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="EVT-XXXXXX-XXXXXX" />
              <Button onClick={() => checkIn(code)} className="btn-primary border-0 rounded-full">Verify</Button>
            </div>
          </div>

          {last && (
            <div className={`mt-6 rounded-xl p-4 flex items-center gap-3 ${last.ok ? "bg-brand-2/15" : "bg-destructive/15"}`}>
              {last.ok ? <CheckCircle2 className="h-5 w-5 text-brand-2" /> : <XCircle className="h-5 w-5 text-destructive" />}
              <span className="text-sm">{last.msg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
