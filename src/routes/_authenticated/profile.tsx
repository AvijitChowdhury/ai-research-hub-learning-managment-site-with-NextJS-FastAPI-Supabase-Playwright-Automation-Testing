import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { updateMyPassword, updateMyProfile } from "@/lib/profile";
import { t } from "@/lib/i18n";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — axiom/lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const profile = useProfile(user?.id);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [pw, setPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setAvatar(profile.avatar_url ?? "");
    }
  }, [profile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile({
        display_name: name.trim().slice(0, 80),
        avatar_url: avatar.trim() || null,
      });
      toast.success(t("profile.saved"));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setChanging(true);
    try {
      await updateMyPassword(pw);
      toast.success(t("profile.password_changed"));
      setPw("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setChanging(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="mono-label mb-2">/ dashboard / profile</div>
          <h1 className="text-3xl">{t("profile.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update your public name and password.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-3xl gap-8 px-6 py-8 md:grid-cols-2">
        <form onSubmit={saveProfile} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
          <div className="mono-label">public profile</div>
          <label className="flex flex-col gap-1">
            <span className="mono-label">Display name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="mono-label">Avatar URL</span>
            <input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://…"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="mono-label">Email</span>
            <input
              value={user?.email ?? ""}
              disabled
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-md bg-signal px-3 py-2 font-mono text-xs text-signal-foreground disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save profile"}
          </button>
        </form>

        <form onSubmit={changePassword} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
          <div className="mono-label">password</div>
          <label className="flex flex-col gap-1">
            <span className="mono-label">New password</span>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              minLength={8}
              required
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={changing || pw.length < 8}
            className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-signal px-3 py-2 font-mono text-xs text-signal-foreground disabled:opacity-50"
          >
            {changing ? "Updating…" : "Change password"}
          </button>
        </form>
      </section>
      <SiteFooter />
    </>
  );
}
