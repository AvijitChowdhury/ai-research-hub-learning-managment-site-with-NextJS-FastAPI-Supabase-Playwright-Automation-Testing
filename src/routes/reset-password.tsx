import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { updateMyPassword } from "@/lib/profile";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — axiom/lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Supabase places tokens in the URL hash on password-recovery links.
    // The client will surface a PASSWORD_RECOVERY event once processed.
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await updateMyPassword(pw);
      toast.success("Password updated. You are signed in.");
      navigate({ to: "/dashboard", replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to reset password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16 md:py-24">
        <div className="mono-label mb-3">$ auth · reset password</div>
        <h1 className="text-3xl">Choose a new password</h1>
        {!ready ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Open the reset link from your email to continue.{" "}
            <Link to="/auth" className="text-signal">Back to sign in</Link>.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="mono-label">New password</span>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
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
              className="mt-2 rounded-md bg-signal px-4 py-3 font-mono text-sm text-signal-foreground disabled:opacity-50"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
