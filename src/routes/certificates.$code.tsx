import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { fetchCertificateByCode, type CertificateWithDetails } from "@/lib/certificates";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CheckCircle2, Share2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/certificates/$code")({
  loader: async ({ params }) => {
    const cert = await fetchCertificateByCode(params.code);
    if (!cert) throw notFound();
    return { cert };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Certificate not found — axiom/lab" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { cert } = loaderData;
    const name = cert.profiles?.display_name || "A student";
    const title = cert.courses?.title || "a course";
    const desc = `${name} completed ${title} on axiom/lab.`;
    return {
      meta: [
        { title: `Certificate — ${title} — axiom/lab` },
        { name: "description", content: desc },
        { property: "og:title", content: `Certificate — ${title}` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: CertNotFound,
  errorComponent: ({ error, reset }) => (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-6 py-24">
        <div className="mono-label mb-2">/ certificates / error</div>
        <h1 className="text-3xl">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 rounded-md border border-border px-3 py-1.5 font-mono text-xs"
        >
          Retry
        </button>
      </section>
      <SiteFooter />
    </>
  ),
  component: CertificatePage,
});

function CertNotFound() {
  return (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-6 py-24">
        <div className="mono-label mb-2">/ certificates / not-found</div>
        <h1 className="text-3xl">Certificate not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This certificate code doesn't match any issued certificate.
        </p>
        <Link
          to="/courses"
          className="mt-6 inline-block font-mono text-xs text-signal underline"
        >
          Browse courses →
        </Link>
      </section>
      <SiteFooter />
    </>
  );
}

function CertificatePage() {
  const { cert } = Route.useLoaderData() as { cert: CertificateWithDetails };
  const [copied, setCopied] = useState(false);
  const studentName = cert.profiles?.display_name || "Student";
  const courseTitle = cert.courses?.title || "Course";
  const instructor = cert.courses?.instructor_name;
  const dateStr = new Date(cert.issued_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="mono-label mb-2">/ certificates / verify</div>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-signal">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-mono text-xs uppercase tracking-wider">verified</span>
          </div>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-xs hover:bg-surface-2"
          >
            <Share2 className="h-3.5 w-3.5" />
            {copied ? "copied!" : "share link"}
          </button>
        </div>

        {/* Certificate card */}
        <div className="relative overflow-hidden rounded-lg border-2 border-border bg-gradient-to-br from-surface via-background to-surface p-10 md:p-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-signal/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-signal/5 blur-3xl" />

          <div className="relative">
            <div className="mono-label text-signal">Certificate of Completion</div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              axiom/lab · applied AI programme
            </div>

            <div className="my-10 border-y border-border py-8 text-center">
              <div className="mono-label mb-3">awarded to</div>
              <div className="font-serif text-4xl md:text-5xl">{studentName}</div>

              <div className="mono-label mb-3 mt-8">for successfully completing</div>
              <div className="text-2xl md:text-3xl">{courseTitle}</div>
              {instructor && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Instructor: {instructor}
                </div>
              )}
            </div>

            <div className="grid gap-6 text-sm md:grid-cols-3">
              <div>
                <div className="mono-label">issued</div>
                <div className="mt-1 font-mono">{dateStr}</div>
              </div>
              <div>
                <div className="mono-label">certificate id</div>
                <div className="mt-1 break-all font-mono text-xs">{cert.code}</div>
              </div>
              <div className="md:text-right">
                <div className="mono-label">verify at</div>
                <div className="mt-1 font-mono text-xs">
                  {typeof window !== "undefined" ? window.location.host : ""}
                  /certificates/…
                </div>
              </div>
            </div>
          </div>
        </div>

        {cert.courses?.slug && (
          <div className="mt-8 flex items-center justify-between rounded-lg border border-border bg-surface p-5">
            <div>
              <div className="mono-label">course</div>
              <div className="mt-1 text-sm">{courseTitle}</div>
            </div>
            <Link
              to="/courses/$slug"
              params={{ slug: cert.courses.slug }}
              className="rounded-md border border-border px-3 py-1.5 font-mono text-xs hover:bg-surface-2"
            >
              view course →
            </Link>
          </div>
        )}
      </section>

      <SiteFooter />
    </>
  );
}
