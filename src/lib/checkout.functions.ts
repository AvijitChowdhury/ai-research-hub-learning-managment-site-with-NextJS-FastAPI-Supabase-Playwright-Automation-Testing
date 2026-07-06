import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader } from "@tanstack/react-start/server";

type CreateCheckoutInput = { courseId: string };

export const createUddoktapayCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CreateCheckoutInput) => {
    if (!data?.courseId || typeof data.courseId !== "string") {
      throw new Error("courseId is required");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.UDDOKTAPAY_API_KEY;
    const baseUrl = (process.env.UDDOKTAPAY_BASE_URL || "").replace(/\/$/, "");
    if (!apiKey || !baseUrl) throw new Error("UdokktaPay is not configured");

    // Load course
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("id, slug, title, price_cents, currency, is_published")
      .eq("id", data.courseId)
      .maybeSingle();
    if (courseErr) throw courseErr;
    if (!course || !course.is_published) throw new Error("Course not available");

    // Already enrolled?
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", course.id)
      .maybeSingle();
    if (existing) return { alreadyEnrolled: true, payment_url: null };

    // Free course — just enroll
    if (!course.price_cents || course.price_cents <= 0) {
      const { error: enrollErr } = await supabase
        .from("enrollments")
        .insert({ user_id: userId, course_id: course.id });
      if (enrollErr && enrollErr.code !== "23505") throw enrollErr;
      return { alreadyEnrolled: true, payment_url: null };
    }

    // Buyer info
    const { data: userRes } = await supabase.auth.getUser();
    const email = userRes.user?.email ?? `user-${userId}@example.com`;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();
    const fullName = profile?.display_name || email.split("@")[0] || "Student";

    // Build return URLs from request origin
    const origin =
      getRequestHeader("origin") ||
      (() => {
        const host = getRequestHeader("host");
        const proto = getRequestHeader("x-forwarded-proto") || "https";
        return host ? `${proto}://${host}` : "";
      })();
    if (!origin) throw new Error("Could not determine request origin");

    // Create pending order
    const amountDollars = course.price_cents / 100;
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        course_id: course.id,
        amount_cents: course.price_cents,
        currency: course.currency ?? "USD",
        status: "pending",
        provider: "uddoktapay",
      })
      .select("id")
      .single();
    if (orderErr) throw orderErr;

    // Call UdokktaPay create-charge
    const payload = {
      full_name: fullName,
      email,
      amount: amountDollars.toFixed(2),
      metadata: { order_id: order.id, user_id: userId, course_id: course.id },
      redirect_url: `${origin}/checkout/return?order_id=${order.id}`,
      cancel_url: `${origin}/courses/${course.slug}?checkout=cancelled`,
      webhook_url: `${origin}/api/public/webhooks/uddoktapay`,
      return_type: "GET",
    };

    const res = await fetch(`${baseUrl}/api/checkout-v2`, {
      method: "POST",
      headers: {
        "RT-UDDOKTAPAY-API-KEY": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || !json?.payment_url) {
      console.error("UdokktaPay create-charge failed", res.status, json);
      throw new Error(json?.message || "Failed to create payment");
    }

    return { alreadyEnrolled: false, payment_url: json.payment_url as string, orderId: order.id };
  });

type VerifyInput = { invoiceId?: string; orderId?: string };

async function verifyAndFinalize(input: {
  invoiceId?: string;
  orderId?: string;
}): Promise<{ status: "paid" | "pending" | "failed"; orderId?: string; courseSlug?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const apiKey = process.env.UDDOKTAPAY_API_KEY;
  const baseUrl = (process.env.UDDOKTAPAY_BASE_URL || "").replace(/\/$/, "");
  if (!apiKey || !baseUrl) throw new Error("UdokktaPay is not configured");

  if (!input.invoiceId) return { status: "pending", orderId: input.orderId };

  const res = await fetch(`${baseUrl}/api/verify-payment`, {
    method: "POST",
    headers: {
      "RT-UDDOKTAPAY-API-KEY": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ invoice_id: input.invoiceId }),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("UdokktaPay verify failed", res.status, json);
    return { status: "failed", orderId: input.orderId };
  }

  const orderId = input.orderId || json?.metadata?.order_id;
  if (!orderId) return { status: "failed" };

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, course_id, status, courses:course_id(slug)")
    .eq("id", orderId)
    .maybeSingle();
  if (orderErr || !order) return { status: "failed" };

  const courseSlug = (order as any).courses?.slug as string | undefined;

  const providerStatus = String(json?.status || "").toUpperCase();
  const isPaid = providerStatus === "COMPLETED";
  const nextStatus: "paid" | "failed" | "pending" =
    isPaid ? "paid" : providerStatus === "PENDING" ? "pending" : "failed";

  if (order.status !== "paid") {
    await supabaseAdmin
      .from("orders")
      .update({
        status: nextStatus,
        provider_invoice_id: input.invoiceId,
        provider_transaction_id: json?.transaction_id ?? null,
        metadata: json ?? {},
      })
      .eq("id", order.id);
  }

  if (isPaid) {
    await supabaseAdmin
      .from("enrollments")
      .insert({ user_id: order.user_id, course_id: order.course_id })
      .then((r) => {
        if (r.error && r.error.code !== "23505") throw r.error;
      });
    return { status: "paid", orderId: order.id, courseSlug };
  }
  return { status: nextStatus, orderId: order.id, courseSlug };
}

export const verifyUddoktapayPayment = createServerFn({ method: "POST" })
  .inputValidator((data: VerifyInput) => data ?? {})
  .handler(async ({ data }) => verifyAndFinalize(data));

export { verifyAndFinalize as _verifyAndFinalize };
