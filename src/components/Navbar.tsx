import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-hook";
import { Button } from "@/components/ui/button";
import { Ticket, LogOut, LayoutDashboard, ScanLine, ShieldCheck } from "lucide-react";

export function Navbar() {
  const { user, isAdmin, isOrganizer, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const onLanding = path === "/";

  return (
    <header className={`fixed top-0 inset-x-0 z-50 ${onLanding ? "" : "glass"}`}>
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center h-9 w-9 rounded-xl btn-primary font-bold">E</span>
          <span className="font-display font-semibold text-lg tracking-tight">Eventide</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition">Home</Link>
          <Link to="/events" className="hover:text-foreground transition">Events</Link>
          {user && <Link to="/tickets" className="hover:text-foreground transition">My Tickets</Link>}
          {isOrganizer && <Link to="/organizer" className="hover:text-foreground transition">Organizer</Link>}
          {isAdmin && <Link to="/admin" className="hover:text-foreground transition">Admin</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-1" />Dashboard</Link></Button>
              <Button size="sm" variant="outline" onClick={() => signOut()}><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
              <Button asChild size="sm" className="btn-primary border-0"><Link to="/auth">Get Started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function IconChip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export { Ticket, ScanLine, ShieldCheck };
