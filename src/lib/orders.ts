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
