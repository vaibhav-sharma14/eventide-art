import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { z } from "zod";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Eventide" }] }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passSchema = z.string().min(8, "Min 8 characters").max(72);

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "organizer">("user");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passSchema.parse(password);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: name || email.split("@")[0], role },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Eventide!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero-grad flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-10 left-10 h-96 w-96 rounded-full bg-brand/30 blur-3xl animate-blob" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-brand-2/25 blur-3xl animate-blob" style={{ animationDelay: "-6s" }} />
      </div>

      <Card className="glass-strong border-0 w-full max-w-md p-8 animate-rise">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <span className="grid place-items-center h-9 w-9 rounded-xl btn-primary font-bold">E</span>
          <span className="font-display font-semibold">Eventide</span>
        </Link>

        <div className="mb-1 inline-flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-brand-2" /> Free to start</div>
        <h1 className="font-display text-2xl font-semibold">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "signin" ? "Sign in to access your events and tickets." : "Join thousands hosting unforgettable events."}
        </p>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="mt-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <TabsContent value="signup" className="space-y-4 m-0">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Doe" maxLength={80} />
              </div>
              <div>
                <Label>I want to</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as any)} className="grid grid-cols-2 gap-2 mt-2">
                  <label className={`glass rounded-xl p-3 cursor-pointer ${role === "user" ? "ring-2 ring-brand" : ""}`}>
                    <RadioGroupItem value="user" className="sr-only" />
                    <div className="font-medium text-sm">Attend events</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Book tickets</div>
                  </label>
                  <label className={`glass rounded-xl p-3 cursor-pointer ${role === "organizer" ? "ring-2 ring-brand" : ""}`}>
                    <RadioGroupItem value="organizer" className="sr-only" />
                    <div className="font-medium text-sm">Host events</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Sell tickets</div>
                  </label>
                </RadioGroup>
              </div>
            </TabsContent>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
            </div>

            <Button type="submit" disabled={loading} className="btn-primary border-0 w-full h-11 rounded-full">
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </Tabs>
      </Card>
    </div>
  );
}
