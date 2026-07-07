import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, LayoutDashboard, User, Receipt } from "lucide-react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Catalog" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAuthenticated } = useAuth();
  const profile = useProfile(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const displayName =
    profile?.display_name ||
    (user?.email ? user.email.split("@")[0] : "you");
  const initials = (displayName || "?").slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
        <Link to="/" className="flex items-center gap-2 font-mono text-sm font-medium">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm bg-signal text-signal-foreground font-bold shadow-[0_0_16px_-2px_var(--signal-glow)]">
            ∴
          </span>
          <span>axiom<span className="text-muted-foreground">/lab</span></span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "rounded-md px-3 py-1.5 text-sm transition-colors " +
                  (active
                    ? "bg-surface-2 text-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="mono-label hidden lg:inline">v0.1 · public preview</span>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md border border-border-strong bg-surface px-2 py-1 text-xs font-mono transition-colors hover:bg-surface-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm bg-signal/20 text-signal font-medium">
                    {initials}
                  </span>
                  <span className="hidden sm:inline max-w-[100px] truncate">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 font-mono text-xs">
                <DropdownMenuLabel className="text-muted-foreground truncate">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders" className="flex items-center gap-2">
                    <Receipt className="h-3.5 w-3.5" /> Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-mono text-foreground transition-colors hover:bg-surface-2"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                className="rounded-md bg-signal px-3 py-1.5 text-xs font-mono font-medium text-signal-foreground shadow-[0_0_20px_-4px_var(--signal-glow)] transition-all hover:brightness-110"
              >
                Enroll →
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm bg-signal text-signal-foreground font-bold">
              ∴
            </span>
            axiom/lab
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A learning platform for people doing research in artificial intelligence.
          </p>
        </div>
        <FooterCol
          heading="Learn"
          links={[
            ["Catalog", "/courses"],
            ["Dashboard", "/dashboard"],
            ["Paper reading list", "/courses"],
          ]}
        />
        <FooterCol
          heading="Platform"
          links={[
            ["Admin", "/admin"],
            ["Docs", "/"],
            ["Status", "/"],
          ]}
        />
        <FooterCol
          heading="Legal"
          links={[
            ["Terms", "/"],
            ["Privacy", "/"],
            ["Refund policy", "/"],
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 font-mono text-xs text-muted-foreground">
          <span>© 2026 axiom/lab · built for AI researchers</span>
          <span>rev · a1b2c3d</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ heading, links }: { heading: string; links: Array<[string, string]> }) {
  return (
    <div>
      <div className="mono-label mb-3">{heading}</div>
      <ul className="space-y-2 text-sm">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-muted-foreground hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
