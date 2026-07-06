import { createFileRoute } from "@tanstack/react-router";
import { _verifyAndFinalize } from "@/lib/checkout.functions";

export const Route = createFileRoute("/api/public/webhooks/uddoktapay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const bodyText = await request.text();
          let body: any = {};
          try {
            body = JSON.parse(bodyText);
          } catch {
            body = {};
          }
          const invoiceId: string | undefined =
            body?.invoice_id || body?.invoiceId || body?.data?.invoice_id;
          const orderId: string | undefined = body?.metadata?.order_id;
          if (!invoiceId) return new Response("missing invoice_id", { status: 400 });

          const result = await _verifyAndFinalize({ invoiceId, orderId });
          return Response.json({ ok: true, status: result.status });
        } catch (e) {
          console.error("uddoktapay webhook error", e);
          return new Response("error", { status: 500 });
        }
      },
      GET: async () => new Response("ok"),
    },
  },
});
