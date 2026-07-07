import { supabase } from "@/integrations/supabase/client";

export type OrderRow = {
  id: string;
  user_id: string;
  course_id: string;
  amount_cents: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  provider: string;
  provider_invoice_id: string | null;
  provider_transaction_id: string | null;
  created_at: string;
  updated_at: string;
  courses: { title: string; slug: string } | null;
  profiles: { display_name: string | null } | null;
};

export async function adminFetchOrders(filters?: {
  status?: OrderRow["status"] | "all";
  search?: string;
}): Promise<OrderRow[]> {
  let q = supabase
    .from("orders")
    .select(
      "id,user_id,course_id,amount_cents,currency,status,provider,provider_invoice_id,provider_transaction_id,created_at,updated_at,courses:course_id(title,slug),profiles:user_id(display_name)"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters?.status && filters.status !== "all") {
    q = q.eq("status", filters.status);
  }
  const { data, error } = await q;
  if (error) throw error;

  let rows = (data ?? []) as unknown as OrderRow[];
  const s = filters?.search?.trim().toLowerCase();
  if (s) {
    rows = rows.filter((r) =>
      [
        r.courses?.title,
        r.courses?.slug,
        r.profiles?.display_name,
        r.provider_invoice_id,
        r.provider_transaction_id,
        r.id,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }
  return rows;
}

// ── Student order history ─────────────────────────────────────
export type MyOrderRow = {
  id: string;
  course_id: string;
  amount_cents: number;
  currency: string;
  status: OrderRow["status"];
  provider: string;
  provider_invoice_id: string | null;
  provider_transaction_id: string | null;
  created_at: string;
  courses: { title: string; slug: string } | null;
};

export async function fetchMyOrders(): Promise<MyOrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,course_id,amount_cents,currency,status,provider,provider_invoice_id,provider_transaction_id,created_at,courses:course_id(title,slug)"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MyOrderRow[];
}

// ── Admin analytics ───────────────────────────────────────────
export type Analytics = {
  totalRevenueCents: number;
  totalOrders: number;
  totalStudents: number;
  todayEnrollments: number;
  todayRevenueCents: number;
  todayIncompleteOrders: number;
  topCourses: Array<{ courseId: string; title: string; slug: string; sales: number; revenueCents: number }>;
};

export async function fetchAnalytics(range?: { from?: string; to?: string }): Promise<Analytics> {
  let orderQ = supabase
    .from("orders")
    .select("id,user_id,course_id,amount_cents,status,created_at,courses:course_id(title,slug)")
    .order("created_at", { ascending: false });
  if (range?.from) orderQ = orderQ.gte("created_at", range.from);
  if (range?.to) orderQ = orderQ.lte("created_at", range.to);
  const { data: orders, error } = await orderQ;
  if (error) throw error;

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id,user_id,enrolled_at");

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();

  const paid = (orders ?? []).filter((o) => o.status === "paid");
  const totalRevenueCents = paid.reduce((a, o) => a + (o.amount_cents ?? 0), 0);
  const todayRevenueCents = paid
    .filter((o) => o.created_at >= startIso)
    .reduce((a, o) => a + (o.amount_cents ?? 0), 0);
  const todayIncompleteOrders = (orders ?? []).filter(
    (o) => o.created_at >= startIso && o.status !== "paid",
  ).length;
  const students = new Set((enrollments ?? []).map((e) => e.user_id)).size;
  const todayEnrollments = (enrollments ?? []).filter((e) => e.enrolled_at >= startIso).length;

  const byCourse = new Map<string, { title: string; slug: string; sales: number; revenueCents: number }>();
  for (const o of paid) {
    const c = (o as any).courses as { title: string; slug: string } | null;
    if (!o.course_id) continue;
    const cur = byCourse.get(o.course_id) ?? {
      title: c?.title ?? "—",
      slug: c?.slug ?? "",
      sales: 0,
      revenueCents: 0,
    };
    cur.sales++;
    cur.revenueCents += o.amount_cents ?? 0;
    byCourse.set(o.course_id, cur);
  }
  const topCourses = Array.from(byCourse.entries())
    .map(([courseId, v]) => ({ courseId, ...v }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 10);

  return {
    totalRevenueCents,
    totalOrders: (orders ?? []).length,
    totalStudents: students,
    todayEnrollments,
    todayRevenueCents,
    todayIncompleteOrders,
    topCourses,
  };
}

export function toCSV(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function downloadFile(name: string, content: string, mime = "text/csv") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
