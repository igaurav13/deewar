# Frame & Form — Poster E-commerce Store

A full-stack poster e-commerce site built with **Next.js 16 (App Router) + TypeScript**, **Supabase** (auth, database, storage), and **Razorpay** (payments). Soft-minimal, gallery-wall aesthetic.

## Stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Database & Auth:** Supabase (Postgres + Row Level Security + Storage)
- **Payments:** Razorpay (Checkout.js + server-side order verification + webhooks)
- **Styling:** Tailwind CSS v4
- **State:** Zustand (cart, persisted to localStorage)
- **Validation:** Zod

## Features

- Product catalog with categories, search, sort, pagination
- Poster detail pages with size selection and image gallery
- Cart (persisted client-side) + slide-out drawer
- Wishlist (requires login)
- Checkout with shipping address form + Razorpay payment (UPI/cards/netbanking/wallets)
- Order history for logged-in users
- Admin panel (gated by `profiles.is_admin`): create/edit/delete posters, view & update order status
- Row Level Security on every table — the database itself enforces who can read/write what

---

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the contents of `supabase/migrations/0001_init.sql`. This creates all tables, RLS policies, the storage bucket for poster images, and seeds the categories.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ server-only, never expose this)

### Make yourself an admin

After signing up through the app once, run this in the SQL Editor (replace the email):

```sql
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

You'll then see an **Admin panel** link in the account menu.

---

## 2. Set up Razorpay

1. Create an account at [razorpay.com](https://razorpay.com). You can start in **Test Mode** without KYC.
2. Go to **Settings → API Keys** → generate a Test key:
   - **Key ID** → `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET` (⚠️ server-only)
3. Go to **Settings → Webhooks**, add an endpoint:
   - URL: `https://yourdomain.com/api/webhooks/razorpay` (use an ngrok/tunnel URL for local testing)
   - Active events: `payment.captured`, `payment.failed`
   - Copy the **Webhook Secret** → `RAZORPAY_WEBHOOK_SECRET`

**Test card:** `4111 1111 1111 1111`, any future expiry, any CVV. Test UPI: `success@razorpay`.

---

## 3. Configure environment variables

Copy the example file and fill in your real keys:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

NEXT_PUBLIC_RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`.env.local` is gitignored — never commit it.

---

## 4. Install & run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

### Seed sample posters (optional)

```bash
npm run seed
```

This inserts 8 sample posters (using royalty-free Unsplash images) so the storefront isn't empty. Swap them out for your own images later via the admin panel.

---

## 5. Add your own poster images

Two options:

- **Supabase Storage (recommended):** Dashboard → Storage → `posters` bucket → upload → copy the public URL → paste into the poster's "Primary image URL" field in the admin panel.
- **Any public image URL** works too (the `next.config.ts` `remotePatterns` currently allows `*.supabase.co` and `images.unsplash.com` — add other hosts there if needed).

---

## How payments flow (for your understanding)

1. Customer fills in shipping address on `/checkout` and clicks **Pay**.
2. Frontend calls `POST /api/razorpay/create-order`, which:
   - Re-fetches each cart line's price **from the database** (never trusts the client's price) via `src/lib/data/pricing.ts`.
   - Creates a Razorpay order for the verified total.
   - Inserts an `orders` row (`status: created`) + `order_items` via the Supabase **service_role** client (bypasses RLS — this is intentional, since at this point we're writing on the authenticated user's behalf after our own checks).
3. Razorpay's Checkout.js modal opens client-side; the customer pays.
4. On success, the frontend calls `POST /api/razorpay/verify`, which checks the HMAC-SHA256 signature Razorpay returned, then marks the order `paid`. This gives the customer instant feedback.
5. **Independently**, Razorpay calls `POST /api/webhooks/razorpay` server-to-server — this is the actual source of truth, since it fires even if the customer closes the tab mid-payment.

## Security notes

- Every table has Row Level Security enabled — see `supabase/migrations/0001_init.sql`.
- The `service_role` key is only ever used in server-only files (`src/lib/supabase/admin.ts`, API routes, server actions) — never in client components.
- Admin server actions (`src/app/actions/admin.ts`) independently re-check `profiles.is_admin` on every call — the `/admin` route's redirect is a UX nicety, not the actual security boundary.
- Cart prices are always recomputed server-side at checkout from the live database — the client-sent price is never trusted.

## Project structure

```
src/
  app/                 routes (App Router)
    actions/           server actions (wishlist, admin)
    api/                route handlers (razorpay create-order/verify, webhook)
    admin/              admin panel (posters, orders)
    account/            order history, wishlist
    shop/, poster/      catalog & product detail
    checkout/, order/   checkout flow + confirmation
  components/
    layout/             navbar, footer
    shop/                cart, poster cards, checkout UI
    admin/               poster form, order status controls
    ui/                  buttons, inputs, headings
  lib/
    supabase/           browser/server/admin/middleware clients
    data/                 server-side data fetching (posters, pricing)
    razorpay/           server SDK instance + client script loader
    store/                zustand cart store
    validation/           zod schemas
  types/                shared TypeScript types
supabase/
  migrations/0001_init.sql   full schema + RLS + seed categories
scripts/seed.ts              sample poster data loader
```
