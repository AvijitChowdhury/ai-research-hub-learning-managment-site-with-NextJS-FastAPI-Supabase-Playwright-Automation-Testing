# axiom/lab

> A modern, full-stack learning platform for teaching research, AI, and applied
> engineering — built with TanStack Start, React 19, TypeScript, Tailwind CSS v4,
> Supabase (Postgres + Row-Level Security), and a Cloudflare Workers edge runtime.

axiom/lab is a production-grade course marketplace and learning management
system. Students discover courses, purchase them via an integrated
UddoktaPay checkout, work through structured lessons, earn verifiable
completion certificates, and leave reviews. Admins manage courses, curriculum,
orders, and content from a first-class admin console.

---

## Table of contents

1. [Feature overview](#feature-overview)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Data model](#data-model)
5. [Request lifecycle](#request-lifecycle)
6. [Project structure](#project-structure)
7. [Local development](#local-development)
8. [Environment variables](#environment-variables)
9. [Database & migrations](#database--migrations)
10. [Authentication & authorization](#authentication--authorization)
11. [Payments](#payments)
12. [Certificates](#certificates)
13. [Testing & quality](#testing--quality)
14. [Deployment](#deployment)
15. [Security model](#security-model)
16. [Roadmap](#roadmap)
17. [License](#license)

---

## Feature overview

**For students**

- Browse a curated catalog with categories, levels, and search.
- Detailed course pages with syllabus, instructor bio, ratings, and reviews.
- Secure checkout via UddoktaPay (bKash, Nagad, cards).
- Personal dashboard tracking enrollments and lesson progress.
- Structured lesson player with per-lesson completion state.
- Auto-issued, publicly verifiable certificates of completion.
- Post-completion reviews and star ratings.

**For admins**

- Role-gated `/admin` console (server-verified `admin` role).
- Full course CRUD: title, slug, price, category, level, instructor, cover.
- Curriculum builder: modules and lessons with ordering.
- Orders dashboard with status filters, search, and revenue stats.
- Publish/unpublish toggle to control catalog visibility.

**Platform**

- Server-side rendering on Cloudflare Workers for fast, SEO-friendly pages.
- Type-safe file-based routing with typed loaders and server functions.
- Row-Level Security on every user-facing table.
- Idempotent database triggers for cross-cutting concerns (e.g. certificates).

---

## Tech stack

| Layer            | Technology                                                          |
| ---------------- | ------------------------------------------------------------------- |
| Framework        | [TanStack Start](https://tanstack.com/start) v1 (React 19, SSR)     |
| Build tool       | Vite 7                                                              |
| Language         | TypeScript (strict)                                                 |
| Routing          | TanStack Router (file-based, type-safe)                             |
| Data fetching    | TanStack Query v5 (SSR-hydrated)                                    |
| Styling          | Tailwind CSS v4 (native `@theme` tokens, Lightning CSS)             |
| UI primitives    | Radix UI + custom shadcn-style components                           |
| Forms/validation | React Hook Form + Zod                                               |
| Database         | Supabase Postgres (RLS-first)                                       |
| Auth             | Supabase Auth (email/password + Google OAuth)                       |
| Server runtime   | Cloudflare Workers (nodejs_compat) via Nitro                        |
| Payments         | UddoktaPay (server-verified webhooks)                               |
| Icons            | Lucide                                                              |

---

## Architecture

High-level system diagram:

```text
                        ┌──────────────────────────────┐
                        │         Web Browser          │
                        │  React 19 + TanStack Router  │
                        └──────────────┬───────────────┘
                                       │ HTTPS
                                       ▼
                ┌────────────────────────────────────────────┐
                │        Cloudflare Workers (Edge)           │
                │                                            │
                │  ┌──────────────────────────────────────┐  │
                │  │  TanStack Start SSR                  │  │
                │  │   • React 19 renderToPipeableStream  │  │
                │  │   • Route loaders + head() metadata  │  │
                │  └──────────────────┬───────────────────┘  │
                │                     │                      │
                │  ┌──────────────────▼───────────────────┐  │
                │  │  Server Functions (createServerFn)   │  │
                │  │   • Typed RPC from client            │  │
                │  │   • requireSupabaseAuth middleware   │  │
                │  └──────────────────┬───────────────────┘  │
                │                     │                      │
                │  ┌──────────────────▼───────────────────┐  │
                │  │  Public API Routes (/api/public/*)   │  │
                │  │   • UddoktaPay webhook (verified)    │  │
                │  └──────────────────┬───────────────────┘  │
                └─────────────────────┼──────────────────────┘
                                      │
                    ┌─────────────────┼──────────────────┐
                    ▼                 ▼                  ▼
        ┌──────────────────┐ ┌────────────────┐ ┌────────────────┐
        │ Supabase Postgres│ │ Supabase Auth  │ │  UddoktaPay    │
        │   • RLS policies │ │  • JWT sessions│ │   • Checkout   │
        │   • Triggers     │ │  • OAuth       │ │   • Webhooks   │
        │   • has_role()   │ │                │ │                │
        └──────────────────┘ └────────────────┘ └────────────────┘
```

Key architectural decisions:

- **Edge-first SSR** — every route renders on Cloudflare Workers, keeping
  time-to-first-byte low globally and enabling per-request personalization.
- **RLS as the security boundary** — the browser talks directly to Postgres
  through the Supabase publishable key; policies (never application code) are
  the source of truth for who can read/write what.
- **Server functions over ad-hoc REST** — `createServerFn` gives typed RPC with
  Zod validators and middleware, so client and server share a single contract.
- **Roles in a dedicated table** — `user_roles` + `has_role()` (SECURITY
  DEFINER) prevents privilege escalation and RLS recursion.
- **Idempotent database triggers** — cross-cutting effects like "issue a
  certificate when the last lesson is completed" live in Postgres, not in
  application code, so they can't be bypassed by clients.

---

## Data model

```text
profiles ─────────┐
                  │
auth.users ───────┼──────< user_roles >────── app_role (enum)
                  │
                  ├──────< enrollments >──────┐
                  │                            │
                  ├──────< lesson_progress >──┼──── lessons ──── modules ──── courses
                  │                            │
                  ├──────< orders >───────────┘         │
                  │                                     │
                  └──────< certificates >───────────────┘
                             (auto-issued)
                                                        │
                                            reviews ────┘
```

Core tables:

| Table             | Purpose                                             |
| ----------------- | --------------------------------------------------- |
| `profiles`        | Public display data for each auth user              |
| `user_roles`      | `admin` / `moderator` / `user` role grants          |
| `courses`         | Catalog entries (published/draft)                   |
| `modules`         | Ordered sections within a course                    |
| `lessons`         | Individual lesson units within a module             |
| `enrollments`     | Which user owns access to which course              |
| `lesson_progress` | Per-lesson completion state                         |
| `orders`          | Payment records with provider + txn metadata        |
| `certificates`    | Auto-issued proof-of-completion tokens (unique code)|
| `reviews`         | Star rating + text review per (user, course)        |

Every user-facing table has RLS enabled, an explicit `GRANT` block, and
policies scoped to `auth.uid()` or `has_role(auth.uid(), 'admin')`.

---

## Request lifecycle

Example: purchasing a course.

```text
1. User → GET /courses/react-fundamentals
   └─ Worker SSR fetches course via public SELECT policy → renders HTML

2. User → clicks "Enroll"
   └─ Client calls createOrder() server function (requireSupabaseAuth)
      └─ Server creates row in `orders` (status=pending)
      └─ Returns UddoktaPay checkout URL

3. Browser → UddoktaPay hosted checkout → payment success

4. UddoktaPay → POST /api/public/webhooks/uddoktapay
   └─ Route handler verifies HMAC signature (constant-time compare)
   └─ Updates `orders.status = 'paid'`
   └─ Inserts row in `enrollments` (service role, RLS bypassed)

5. User → /learn/react-fundamentals/…
   └─ RLS lets user read lessons for enrolled courses
   └─ Marks lessons complete → lesson_progress trigger fires
      └─ When all lessons done → certificate row inserted (ON CONFLICT DO NOTHING)

6. User → /certificates/{code}
   └─ Public SELECT by code renders a shareable proof page
```

---

## Project structure

```text
src/
├── routes/                       # File-based routes (TanStack Router)
│   ├── __root.tsx                # HTML shell, providers, head metadata
│   ├── index.tsx                 # Landing page
│   ├── courses.tsx               # Catalog
│   ├── courses.$slug.tsx         # Course detail
│   ├── auth.tsx                  # Sign in / sign up
│   ├── checkout.return.tsx       # Post-payment return page
│   ├── certificates.$code.tsx    # Public certificate verify
│   ├── _authenticated/           # Auth-gated subtree
│   │   ├── route.tsx             # Session gate (redirects to /auth)
│   │   ├── dashboard.tsx
│   │   ├── learn.$slug.$lessonId.tsx
│   │   ├── admin.tsx
│   │   ├── admin.orders.tsx
│   │   └── admin.courses.$id.tsx
│   └── api/public/               # Public HTTP endpoints (webhooks, etc.)
│       └── webhooks.uddoktapay.ts
├── components/                   # Reusable UI (site chrome, cards, reviews…)
├── hooks/                        # use-auth, use-mobile, …
├── lib/                          # Domain modules
│   ├── admin.ts                  # Admin CRUD helpers
│   ├── courses.ts                # Catalog queries
│   ├── orders.ts                 # Order queries
│   ├── certificates.ts           # Certificate queries
│   ├── reviews.ts                # Reviews queries + mutations
│   └── checkout.functions.ts     # createServerFn for checkout
├── integrations/supabase/        # Auto-generated Supabase clients + types
├── router.tsx                    # Router construction (QueryClient in context)
├── server.ts                     # SSR error wrapper (Nitro entry)
├── start.ts                      # createStart config + middleware
└── styles.css                    # Tailwind v4 tokens + @theme

supabase/
└── migrations/                   # Versioned SQL migrations
```

---

## Local development

Prerequisites:

- [Bun](https://bun.sh) ≥ 1.1 (or Node 20+ / pnpm — Bun preferred)
- A Supabase project (or a local `supabase start` stack)

```bash
# install deps
bun install

# start the dev server (SSR + HMR on http://localhost:8080)
bun run dev

# type-check
bunx tsgo --noEmit

# lint & format
bun run lint
bun run format
```

---

## Environment variables

Create a `.env` file at the repository root:

```env
# Public (shipped to the browser)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-anon-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>

# Server-only (never exposed to the client)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Payments
UDDOKTAPAY_API_KEY=<uddoktapay-api-key>
UDDOKTAPAY_WEBHOOK_SECRET=<hmac-shared-secret>
```

`process.env.*` is available inside `createServerFn` handlers and server route
handlers. `import.meta.env.VITE_*` is available on both client and server.

---

## Database & migrations

Migrations live in `supabase/migrations/` and are applied in filename order.
Every migration that creates a `public` table follows the required contract:

```sql
CREATE TABLE public.<name> (...);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.<name> TO authenticated;
GRANT ALL ON public.<name> TO service_role;
-- GRANT SELECT ON public.<name> TO anon;  -- only when explicitly public

ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY ... ON public.<name> ...;
```

Roles are checked through the `SECURITY DEFINER` function `public.has_role(uuid, app_role)`
to avoid RLS recursion and privilege escalation.

---

## Authentication & authorization

- Email/password and Google OAuth via Supabase Auth.
- Client session is restored automatically by the Supabase JS client.
- Server functions that require an authenticated user chain the
  `requireSupabaseAuth` middleware, which validates the bearer token and
  exposes `{ supabase, userId, claims }` on `context`.
- The `/_authenticated/*` route subtree is gated by `_authenticated/route.tsx`,
  which redirects unauthenticated users to `/auth` before any loader runs.
- Admin gating is a two-step check: the `_authenticated` gate ensures a
  session, then `useRoles(user.id)` + a `has_role()`-backed RLS policy ensure
  the caller is actually an admin.

---

## Payments

Checkout uses [UddoktaPay](https://uddoktapay.com/) with a server-verified
webhook. The flow:

1. `createOrder()` (server function) creates a `pending` `orders` row and
   requests a hosted checkout URL from UddoktaPay.
2. User completes payment on UddoktaPay.
3. UddoktaPay POSTs to `/api/public/webhooks/uddoktapay`.
4. The route handler verifies the HMAC signature with a constant-time
   compare, then transitions the order to `paid` and creates the matching
   `enrollments` row via the service-role client.

The webhook route is under `/api/public/*` so it bypasses the auth gate on
published deployments — signature verification is mandatory.

---

## Certificates

When a student marks the final lesson of a course complete, a Postgres trigger
(`issue_certificate_if_complete`) counts the distinct completed lessons for
that `(user_id, course_id)` pair. If the count matches the course's lesson
total, it inserts a row into `certificates` with a random UUID `code`. The
insert is idempotent (`ON CONFLICT (user_id, course_id) DO NOTHING`).

The certificate URL — `/certificates/{code}` — is the proof itself. Anyone
with the link can verify the certificate; only holders of the UUID can share
it. The page ships OG/Twitter tags for rich previews when shared.

---

## Testing & quality

- **Type safety** — strict TypeScript, typed routes, typed server functions.
- **Static analysis** — ESLint with TanStack + React 19 rules; Prettier for
  formatting.
- **Runtime error reporting** — a lightweight React error boundary funnels
  uncaught exceptions to a central reporter (see `src/lib/error-capture.ts`).

Run all checks:

```bash
bun run lint
bunx tsgo --noEmit
bun run build     # ensures the Worker bundle succeeds
```

---

## Deployment

The app builds to a Cloudflare Workers bundle via TanStack Start's Nitro
integration.

```bash
bun run build
# Emits .output/ ready for Cloudflare deploy (wrangler / Pages / CI)
```

Any hosting target that supports the Workers runtime (Cloudflare Workers,
Cloudflare Pages Functions) works out of the box. All server code must be
compatible with the `workerd` runtime — no `child_process`, no native
addons, no `fs.watch`, no `sharp`/`canvas`/`puppeteer`. Prefer pure JS,
Web-standard APIs, and fetch-based clients.

---

## Security model

- **Defense in depth** — every table has RLS; the browser cannot bypass it
  even with the publishable key.
- **Least privilege** — anonymous access is only granted where a table is
  explicitly public (e.g. published courses, certificate verify by code).
- **Roles table** — roles live in `user_roles`, never on `profiles`, to
  prevent privilege escalation via profile updates.
- **SECURITY DEFINER + fixed `search_path`** — `has_role()` runs with its
  owner's privileges under a locked-down `search_path`.
- **Webhook signature verification** — UddoktaPay callbacks are HMAC-verified
  with `timingSafeEqual` before any state change.
- **Secrets never in the client bundle** — service role keys and payment
  secrets are read from `process.env` inside handler bodies only.

---

## Roadmap

- Instructor payouts and multi-instructor revenue splits
- Discussion threads per lesson
- Video hosting with signed URLs
- Downloadable PDF certificates
- Coupon codes and promotional pricing
- Learning analytics (time-on-task, drop-off funnels)

---

## License

Proprietary — all rights reserved. Contact the maintainers for licensing terms.
