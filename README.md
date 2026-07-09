<div align="center">

# axiom/lab

**A production-grade learning platform for research, AI, and applied engineering.**

_TanStack Start · React 19 · TypeScript · Tailwind v4 · Supabase · Cloudflare Workers_

[![TanStack Start](https://img.shields.io/badge/TanStack_Start-v1-0284c7?logo=react&logoColor=white)](https://tanstack.com/start)
[![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_+_RLS-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)
[![Cloudflare Workers](https://img.shields.io/badge/Runtime-Cloudflare_Workers-f38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Tests](https://img.shields.io/badge/e2e_tests-98%2F98_passing-2ea043?logo=playwright&logoColor=white)](#end-to-end-tests-playwright--pytest--allure)
[![License](https://img.shields.io/badge/license-Proprietary-lightgrey)](#license)

[Overview](#overview) · [Architecture](#architecture) · [Data model](#data-model) · [Testing](#testing--quality) · [Deployment](#deployment)

</div>

---

## Overview

axiom/lab is a production-grade course marketplace and learning management
system. Students discover courses, purchase them via an integrated
UddoktaPay checkout, work through structured lessons, earn verifiable
completion certificates, and leave reviews. Admins manage courses,
curriculum, orders, and content from a first-class admin console.

The stack is intentionally edge-native and RLS-first: every page renders on
Cloudflare Workers, and the browser talks to Postgres directly through
policies that are the single source of truth for authorization.

## Table of contents

1. [Overview](#overview)
2. [Feature overview](#feature-overview)
3. [Tech stack](#tech-stack)
4. [Architecture](#architecture)
5. [Testing architecture](#testing-architecture)
6. [Data model](#data-model)
7. [Request lifecycle](#request-lifecycle)
8. [Project structure](#project-structure)
9. [Local development](#local-development)
10. [Environment variables](#environment-variables)
11. [Database & migrations](#database--migrations)
12. [Authentication & authorization](#authentication--authorization)
13. [Payments](#payments)
14. [Certificates](#certificates)
15. [Testing & quality](#testing--quality)
16. [Deployment](#deployment)
17. [Security model](#security-model)
18. [Roadmap](#roadmap)
19. [Contributing](#contributing)
20. [License](#license)

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

End-to-end system architecture — request path, edge runtime layers, and
managed backends:

```mermaid
flowchart TB
    subgraph Client["🌐 Web Browser"]
        UI["React 19 UI<br/>TanStack Router · Query<br/>Tailwind v4"]
    end

    subgraph Edge["⚡ Cloudflare Workers (Edge Runtime)"]
        direction TB
        SSR["TanStack Start SSR<br/>renderToPipeableStream<br/>Route loaders · head() meta"]
        RPC["Server Functions<br/>createServerFn + Zod<br/>requireSupabaseAuth middleware"]
        API["Public API Routes<br/>/api/public/*<br/>HMAC-verified webhooks"]
        SSR --> RPC
        RPC --> API
    end

    subgraph Data["🗄️ Supabase (Managed)"]
        PG[("Postgres<br/>RLS policies<br/>Triggers · has_role()")]
        AUTH["Auth<br/>JWT · Email · OAuth"]
        STORE["Storage<br/>signed URLs"]
    end

    subgraph Ext["🔌 External Services"]
        PAY["UddoktaPay<br/>Checkout + Webhooks"]
    end

    UI -- "HTTPS · SSR request" --> SSR
    UI -- "typed RPC · fetch" --> RPC
    UI -. "publishable key + JWT (RLS-scoped)" .-> PG
    UI -. "session" .-> AUTH
    RPC --> PG
    RPC --> AUTH
    RPC --> PAY
    PAY -- "signed webhook" --> API
    API -- "service role" --> PG

    classDef edge fill:#f38020,stroke:#b35a0f,color:#fff;
    classDef data fill:#3ecf8e,stroke:#1f7d54,color:#062;
    classDef ext fill:#eab308,stroke:#a16207,color:#111;
    classDef ui fill:#149eca,stroke:#0b6a89,color:#fff;
    class SSR,RPC,API edge;
    class PG,AUTH,STORE data;
    class PAY ext;
    class UI ui;
```

### Key architectural decisions

- **Edge-first SSR** — every route renders on Cloudflare Workers, keeping
  time-to-first-byte low globally and enabling per-request personalization.
- **RLS as the security boundary** — the browser talks directly to Postgres
  through the Supabase publishable key; policies (never application code)
  are the source of truth for who can read/write what.
- **Server functions over ad-hoc REST** — `createServerFn` gives typed RPC
  with Zod validators and middleware, so client and server share a single
  contract.
- **Roles in a dedicated table** — `user_roles` + `has_role()`
  (SECURITY DEFINER) prevents privilege escalation and RLS recursion.
- **Idempotent database triggers** — cross-cutting effects like "issue a
  certificate when the last lesson is completed" live in Postgres, not in
  application code, so they can't be bypassed by clients.

---

## Testing architecture

The test pyramid combines fast static checks with a broad Playwright-driven
end-to-end suite. All layers run in CI on every change; the E2E layer
publishes an Allure report as its artifact.

```mermaid
flowchart TB
    subgraph Pyramid["🧪 Test Pyramid"]
        direction TB
        E2E["🌐 <b>End-to-End</b> — Playwright + pytest<br/>98 tests · Chromium · ~54s<br/><i>routing · SEO · a11y · perf · auth · flows</i>"]
        INT["🔗 <b>Integration</b> — server functions + RLS<br/>createServerFn contracts · policy checks"]
        STATIC["⚙️ <b>Static</b> — tsgo · ESLint · Prettier · build<br/>strict types · lint rules · Worker bundle"]
        STATIC --> INT --> E2E
    end

    subgraph Runner["▶️ Test Runner"]
        PYTEST["pytest<br/>parallel workers"]
        PW["Playwright<br/>Chromium headless"]
        FIX["conftest.py<br/>fixtures · seed users<br/>admin + student sessions"]
        PYTEST --> PW
        PYTEST --> FIX
    end

    subgraph SUT["🎯 System Under Test"]
        DEV["localhost:8080<br/>bun run dev (SSR)"]
        SUPA[("Supabase<br/>Postgres + Auth")]
        DEV --> SUPA
    end

    subgraph Report["📊 Reporting"]
        ALLURE["Allure<br/>epics · features · stories"]
        SHOTS["Screenshots<br/>docs/screenshots/e2e/"]
        HTML["Single-file HTML report<br/>reports/index.html"]
        ALLURE --> HTML
    end

    E2E --> PYTEST
    PW -- "HTTP · DOM · console" --> DEV
    FIX -- "auth · seed data" --> SUPA
    PW -- "screenshots + traces" --> SHOTS
    PYTEST -- "results.json" --> ALLURE

    classDef test fill:#2ea043,stroke:#1a6b2b,color:#fff;
    classDef run fill:#8b5cf6,stroke:#5b21b6,color:#fff;
    classDef sut fill:#149eca,stroke:#0b6a89,color:#fff;
    classDef rep fill:#eab308,stroke:#a16207,color:#111;
    class E2E,INT,STATIC test;
    class PYTEST,PW,FIX run;
    class DEV,SUPA sut;
    class ALLURE,SHOTS,HTML rep;
```

**Coverage matrix at a glance**

| Layer | Tool | What it catches |
| ----- | ---- | --------------- |
| Types | `tsgo --noEmit` | contract drift between client, server functions, and DB types |
| Lint | ESLint (TanStack + React 19 rules) | hook misuse, unsafe patterns, unused code |
| Build | `bun run build` | Worker-incompatible imports, bundle errors, SSR regressions |
| E2E   | Playwright + pytest | routing, SEO/meta, JSON-LD, a11y, perf budgets, auth flows |
| Visual | Screenshot baselines | rendered page regressions (checked into `docs/screenshots/e2e/`) |
| Report | Allure single-file HTML | grouped by epic/feature/story, timeline, severity |

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
│   ├── courses.index.tsx         # Catalog
│   ├── courses.$slug.tsx         # Course detail
│   ├── auth.tsx                  # Sign in / sign up
│   ├── checkout.return.tsx       # Post-payment return page
│   ├── certificates.$code.tsx    # Public certificate verify
│   ├── _authenticated/           # Auth-gated subtree
│   │   ├── route.tsx             # Session gate (redirects to /auth)
│   │   ├── dashboard.tsx
│   │   ├── learn.$slug.$lessonId.tsx
│   │   ├── admin.index.tsx
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

### Static analysis

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

### End-to-end tests (Playwright + pytest + Allure)

The `tests/e2e/` suite exercises the app end-to-end against a running instance
using **Playwright** driven by **pytest**, with results published as an
**Allure** report. The suite is intentionally broad — it covers routing,
metadata, structured data, accessibility, public assets, navigation flows,
authentication redirects, catalog filtering, course detail pages, certificate
verification, 404 handling, and per-route performance budgets.

| Suite | File | Focus |
| ----- | ---- | ----- |
| Home | `test_home.py` | landing page shell, meta, JSON-LD, console health |
| Catalog | `test_catalog.py` | filters, search, empty state, structured data |
| Course detail | `test_course_detail.py` | parametrized across every seeded slug |
| Auth | `test_auth.py` | form fields, `noindex`, protected-route redirects |
| Certificates & 404 | `test_certificates_404.py` | verify page + not-found paths |
| Navigation | `test_navigation.py` | header/footer, in-app link flow |
| SEO & a11y | `test_seo.py` | titles, viewport, `lang`, alt text, internal links |
| Structured data | `test_structured_data.py` | JSON-LD validity + shape |
| Public assets | `test_public_assets.py` | `robots.txt`, `sitemap.xml`, `llms.txt` |
| Performance | `test_performance.py` | render-time budgets per route |

**Latest run:** `98 passed in 53.40s` (chromium, headless).

#### Running the suite locally

```bash
# 1. install once
python -m pip install pytest pytest-playwright allure-pytest
playwright install chromium

# 2. start the dev server in another terminal
bun run dev

# 3. run the suite (results stream to /tmp/allure-results)
python -m pytest tests/e2e

# 4. generate a single-file Allure report
allure generate /tmp/allure-results -o reports/ --clean --single-file
open reports/index.html
```

#### Allure report

The latest run produced **98 passing tests in ~54s** on Chromium, grouped by
feature/epic (`axiom/lab → Home / Catalog / Course Detail / Auth / SEO / …`).
Screenshots of the generated Allure report are checked in under
[`docs/allure/`](./docs/allure) so the results are visible directly from
GitHub without hosting the HTML bundle.

**Overview — 98/98 passing**

![Allure overview — 98 tests, 100% pass rate](./docs/allure/overview.png)

**Suites — per-module breakdown**

![Allure suites — per-module test counts](./docs/allure/suites.png)

**Graphs — status, severity, duration distribution**

![Allure graphs — status, severity, duration](./docs/allure/graphs.png)

**Timeline — parallel worker execution**

![Allure timeline — parallel worker execution](./docs/allure/timeline.png)

**Behaviors — epic / feature / story tree**

![Allure behaviors — epic and feature tree](./docs/allure/behaviors.png)

To regenerate the full interactive report locally, run the commands above and
open `reports/index.html` (or `reports/allure-report.html` when using
`--single-file`). Everything (assets, data, styles) is inlined so no web server
is required.

#### Current Playwright screenshots

The current visual baseline is checked in under
[`docs/screenshots/e2e/`](./docs/screenshots/e2e). These screenshots show
real rendered pages, including authenticated student and admin surfaces.

**Public pages**

| Route | Screenshot |
| ----- | ---------- |
| `/` — landing | ![Home](./docs/screenshots/e2e/public-home.png) |
| `/courses` — catalog | ![Catalog](./docs/screenshots/e2e/public-catalog.png) |
| `/courses/transformers-from-scratch` | ![Course: Transformers](./docs/screenshots/e2e/public-course-transformers.png) |
| `/courses/rlhf-and-alignment` | ![Course: RLHF](./docs/screenshots/e2e/public-course-rlhf.png) |
| `/courses/diffusion-models` | ![Course: Diffusion](./docs/screenshots/e2e/public-course-diffusion.png) |
| `/auth` — sign in | ![Auth sign in](./docs/screenshots/e2e/public-auth-signin.png) |
| `/reset-password` | ![Reset password](./docs/screenshots/e2e/public-reset-password.png) |
| `/certificates/{code}` — unknown code | ![Certificate verify](./docs/screenshots/e2e/public-certificate-unknown.png) |

**Authenticated student pages**

| Route | Screenshot |
| ----- | ---------- |
| `/dashboard` | ![Student dashboard](./docs/screenshots/e2e/student-dashboard.png) |
| `/orders` | ![Student orders](./docs/screenshots/e2e/student-orders.png) |
| `/profile` | ![Student profile](./docs/screenshots/e2e/student-profile.png) |
| `/courses/transformers-from-scratch` | ![Student course detail](./docs/screenshots/e2e/student-course-detail.png) |

**Authenticated admin pages**

| Route | Screenshot |
| ----- | ---------- |
| `/dashboard` | ![Admin dashboard](./docs/screenshots/e2e/admin-dashboard.png) |
| `/profile` | ![Admin profile](./docs/screenshots/e2e/admin-profile.png) |
| `/admin` | ![Admin content management](./docs/screenshots/e2e/admin-admin-home.png) |
| `/admin/courses/:id` | ![Admin course editor](./docs/screenshots/e2e/admin-course-editor.png) |
| `/admin/orders` | ![Admin orders](./docs/screenshots/e2e/admin-admin-orders.png) |
| `/admin/reviews` | ![Admin reviews](./docs/screenshots/e2e/admin-admin-reviews.png) |
| `/admin/analytics` | ![Admin analytics](./docs/screenshots/e2e/admin-admin-analytics.png) |
| `/admin/instructors` | ![Admin instructors](./docs/screenshots/e2e/admin-admin-instructors.png) |

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
