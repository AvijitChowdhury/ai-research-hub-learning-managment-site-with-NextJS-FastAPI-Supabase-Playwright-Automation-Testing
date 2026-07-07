import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { sendPasswordReset } from "@/lib/profile";
import { t } from "@/lib/i18n";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — axiom/lab" },
      { name: "description", content: "Sign in or create your axiom/lab account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(128);
const nameSchema = z.string().trim().min(1, "Required").max(80);

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();
  const router = useRouter();

  // If already signed in, bounce to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const em = emailSchema.parse(email);
      const pw = passwordSchema.parse(password);
      setBusy(true);
      if (mode === "signup") {
        const name = nameSchema.parse(displayName);
        const { error } = await supabase.auth.signUp({
          email: em,
          password: pw,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      await router.invalidate();
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setErr(null);
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      await router.invalidate();
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Google sign-in failed";
      setErr(msg);
      setBusy(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-6 py-16 md:py-24">
        <div className="mono-label mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          {mode === "signin" ? "$ auth · sign in" : "$ auth · create account"}
        </div>
        <h1 className="text-3xl md:text-4xl">
          {mode === "signin" ? "Welcome back." : "Join the lab."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to continue your cohort."
            : "Create an account to enroll and track your progress."}
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="mt-8 inline-flex items-center justify-center gap-3 rounded-md border border-border-strong bg-surface px-4 py-3 font-mono text-sm transition-colors hover:bg-surface-2 disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="mono-label">or with email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <label className="flex flex-col gap-1.5">
              <span className="mono-label">Display name</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={80}
                autoComplete="name"
                className="rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-signal"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="mono-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              autoComplete="email"
              className="rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-signal"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="mono-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-signal"
            />
          </label>

          {err && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            aria-label={busy ? (mode === "signin" ? "Signing in" : "Creating account") : undefined}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-signal px-4 py-3 font-mono text-sm font-medium text-signal-foreground shadow-[0_0_40px_-8px_var(--signal-glow)] transition-all hover:brightness-110 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                {mode === "signin" ? "Sign in" : "Create account"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>

        </form>

        {mode === "signin" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={async () => {
                try {
                  const em = emailSchema.parse(email);
                  await sendPasswordReset(em);
                  toast.success(t("auth.reset_email_sent"));
                } catch (e: any) {
                  toast.error(e?.message ?? "Enter your email above first.");
                }
              }}
              className="mono-label hover:text-foreground"
            >
              {t("auth.forgot")}
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-mono text-signal hover:underline"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-mono text-signal hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link to="/" className="mono-label hover:text-foreground">
            ← back to home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
