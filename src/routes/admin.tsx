import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { COURSES } from "@/lib/mock-data";
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — axiom/lab" },
      { name: "description", content: "Admin dashboard for axiom/lab." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const ORDERS = [
  { id: "ord_8x2q", user: "s.chen@stanford.edu", course: "Transformers From Scratch", amount: 149, status: "PAID", when: "12 min ago" },
  { id: "ord_8x1p", user: "riko.t@tokyo.ac.jp", course: "Diffusion Models In Depth", amount: 179, status: "PAID", when: "1h ago" },
  { id: "ord_8x0k", user: "m.dubois@inria.fr", course: "RLHF & Modern Alignment", amount: 199, status: "PENDING", when: "3h ago" },
  { id: "ord_8wzc", user: "hana@example.com", course: "ML Systems Engineering", amount: 189, status: "PAID", when: "5h ago" },
  { id: "ord_8wy8", user: "trainer@lab.dev", course: "How To Read AI Papers", amount: 79, status: "REFUNDED", when: "1d ago" },
  { id: "ord_8wxa", user: "priya@iisc.ac.in", course: "Reinforcement Learning: Fundamentals", amount: 129, status: "PAID", when: "1d ago" },
];

export default function _admin() {
  return null;
}

function Admin() {
  const stats = [
    { icon: DollarSign, label: "Revenue (30d)", value: "$18,420", delta: "+12%" },
    { icon: ShoppingCart, label: "Orders (30d)", value: "142", delta: "+8%" },
    { icon: Users, label: "Students (all-time)", value: "38,308", delta: "+240 this wk" },
    { icon: TrendingUp, label: "Avg completion", value: "68%", delta: "+3pts" },
  ];

  return (
    <>
      <SiteHeader />

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="mono-label mb-2">/ admin</div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl">Platform overview</h1>
              <p className="mt-1 text-sm text-muted-foreground">Last synced 30 seconds ago.</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-md border border-border-strong bg-surface px-3 py-1.5 font-mono text-xs">
                Export CSV
              </button>
              <button className="rounded-md bg-signal px-3 py-1.5 font-mono text-xs text-signal-foreground">
                + New course
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-background p-5">
              <div className="flex items-center justify-between">
                <div className="mono-label">{s.label}</div>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 font-mono text-2xl">{s.value}</div>
              <div className="mono-label mt-1 text-signal">{s.delta}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent orders */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-4 flex items-baseline justify-between">
          <div className="mono-label">recent orders</div>
          <a className="mono-label hover:text-foreground" href="#">view all →</a>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-normal">Order</th>
                <th className="px-4 py-3 text-left font-normal">User</th>
                <th className="px-4 py-3 text-left font-normal">Course</th>
                <th className="px-4 py-3 text-right font-normal">Amount</th>
                <th className="px-4 py-3 text-left font-normal">Status</th>
                <th className="px-4 py-3 text-right font-normal">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {ORDERS.map((o) => (
                <tr key={o.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-mono text-xs text-signal">{o.id}</td>
                  <td className="px-4 py-3">{o.user}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.course}</td>
                  <td className="px-4 py-3 text-right font-mono">${o.amount}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{o.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Courses table */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-4 mono-label">courses</div>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-normal">Title</th>
                <th className="px-4 py-3 text-left font-normal">Instructor</th>
                <th className="px-4 py-3 text-left font-normal">Category</th>
                <th className="px-4 py-3 text-right font-normal">Students</th>
                <th className="px-4 py-3 text-right font-normal">Rating</th>
                <th className="px-4 py-3 text-right font-normal">Price</th>
                <th className="px-4 py-3 text-left font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {COURSES.map((c) => (
                <tr key={c.id} className="hover:bg-surface">
                  <td className="px-4 py-3">{c.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.instructor.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.category}</td>
                  <td className="px-4 py-3 text-right font-mono">{c.studentsCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">{c.rating.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right font-mono">${c.price}</td>
                  <td className="px-4 py-3">
                    <StatusPill status="PUBLISHED" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-signal/15 text-signal border-signal/30",
    PUBLISHED: "bg-signal/15 text-signal border-signal/30",
    PENDING: "bg-warn/15 text-warn border-warn/30",
    REFUNDED: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <span
      className={`inline-flex rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${map[status] ?? "bg-surface-2 text-muted-foreground border-border"}`}
    >
      {status}
    </span>
  );
}
