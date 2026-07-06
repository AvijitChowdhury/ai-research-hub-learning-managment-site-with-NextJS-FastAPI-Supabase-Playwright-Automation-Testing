import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { verifyUddoktapayPayment } from "@/lib/checkout.functions";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Search = { invoice_id?: string; order_id?: string };

export const Route = createFileRoute("/checkout/return")({
  head: () => ({
    meta: [
      { title: "Checkout — axiom/lab" },
      { name: "description", content: "Verifying your payment and enrollment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    invoice_id: typeof s.invoice_id === "string" ? s.invoice_id : undefined,
    order_id: typeof s.order_id === "string" ? s.order_id : undefined,
  }),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center text-muted-foreground">
      <div className="mono-label">error</div>
      <p className="mt-3">{(error as Error).message}</p>
    </div>
  ),
  notFoundComponent: () => null,
  component: CheckoutReturn,
});


function CheckoutReturn() {
  const { invoice_id, order_id } = Route.useSearch();
  const navigate = useNavigate();
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "paid"; slug?: string } | { kind: "pending" } | { kind: "failed"; message?: string }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await verifyUddoktapayPayment({ data: { invoiceId: invoice_id, orderId: order_id } });
        if (cancelled) return;
        if (res.status === "paid") {
          setState({ kind: "paid", slug: res.courseSlug });
          setTimeout(() => {
            if (res.courseSlug) navigate({ to: "/courses/$slug", params: { slug: res.courseSlug } });
            else navigate({ to: "/dashboard" });
          }, 1500);
        } else if (res.status === "pending") {
          setState({ kind: "pending" });
        } else {
          setState({ kind: "failed" });
        }
      } catch (e) {
        if (!cancelled) setState({ kind: "failed", message: (e as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invoice_id, order_id, navigate]);

  return (
    <>
      <SiteHeader />
      <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        {state.kind === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-signal" />
            <div className="mono-label mt-6">verifying payment</div>
            <p className="mt-2 text-muted-foreground">Hold on while we confirm with UdokktaPay…</p>
          </>
        )}
        {state.kind === "paid" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-signal" />
            <h1 className="mt-6 text-3xl">Payment confirmed</h1>
            <p className="mt-3 text-muted-foreground">You're enrolled. Redirecting to your course…</p>
          </>
        )}
        {state.kind === "pending" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <h1 className="mt-6 text-2xl">Payment pending</h1>
            <p className="mt-3 text-muted-foreground">
              We haven't received final confirmation yet. You can safely close this tab —
              we'll enroll you as soon as the payment clears.
            </p>
            <Link to="/dashboard" className="mono-label mt-6 hover:text-foreground">
              go to dashboard →
            </Link>
          </>
        )}
        {state.kind === "failed" && (
          <>
            <XCircle className="h-12 w-12 text-destructive" />
            <h1 className="mt-6 text-2xl">Payment not completed</h1>
            <p className="mt-3 text-muted-foreground">
              {state.message ?? "The payment was cancelled or could not be verified. No charge was made."}
            </p>
            <Link to="/courses" className="mono-label mt-6 hover:text-foreground">
              ← back to catalog
            </Link>
          </>
        )}
      </section>
      <SiteFooter />
    </>
  );
}
