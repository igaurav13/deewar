# Getting your keys — Deewars.in

This project already has Supabase (database + auth) and Razorpay (payments)
fully wired into the code — order creation, server-side price verification,
webhook signature checks, RLS-protected tables, all of it. You just need to
drop in **your own keys**. This guide walks through exactly where to find
each one.

Total time: ~15 minutes.

---

## 1. Supabase (database, auth, image storage)

### 1.1 Create a project
1. Go to [supabase.com](https://supabase.com) → sign up / log in.
2. **New project** → pick a name (e.g. `deewars`), a strong database
   password (save it somewhere), and a region close to India
   (e.g. `ap-south-1 (Mumbai)`).
3. Wait ~2 minutes for provisioning.

### 1.2 Run the schema
1. In your project, go to the **SQL Editor** (left sidebar).
2. Open `supabase/migrations/0001_init.sql` from this repo, copy its
   entire contents, paste into the SQL editor, and click **Run**.
   This creates every table, Row Level Security policy, the `posters`
   storage bucket, and seeds the starting categories.

### 1.3 Copy your keys
Go to **Project Settings → API**:

| Field on the page              | Paste into `.env.local` as               |
|---------------------------------|-------------------------------------------|
| Project URL                     | `NEXT_PUBLIC_SUPABASE_URL`                |
| `anon` / `publishable` key      | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`    |
| `service_role` key (⚠️ secret)  | `SUPABASE_SERVICE_ROLE_KEY`               |

> ⚠️ The `service_role` key bypasses all security rules. Never put it in
> client-side code, never commit it, never share it. It's only read on the
> server in this project (API routes / server actions).

### 1.4 Make yourself an admin
1. Run the app once (`npm run dev`) and sign up through the site with your
   own email at `/signup`.
2. Back in Supabase → **SQL Editor**, run (replace the email):
   ```sql
   update public.profiles
   set is_admin = true
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Log out and back in — you'll see **Admin panel** in the account menu,
   where you can add/edit posters and manage orders.

### 1.5 (Optional) Seed sample posters
```bash
npm run seed
```
Inserts 8 sample posters with placeholder images so the storefront isn't
empty while you upload your own designs.

### 1.6 Email confirmation — no extra key needed to start

Signup emails ("check your inbox to confirm your email") work **out of the
box** — Supabase runs a built-in mailer for every project, no SMTP key
required to get started. Two things to know:

- **It's rate-limited and not meant for production.** The built-in mailer
  caps out at roughly a handful of auth emails per hour project-wide (all
  auth email types share the limit — signup, password reset, etc.), and
  sends from a generic `noreply@mail.supabase.io`-style address that some
  inboxes flag as spam. Fine for development and testing; not fine for
  real users.
- **Site URL / Redirect URLs must be set correctly**, or the confirmation
  link in the email will send people to the wrong domain. Dashboard →
  **Authentication → URL Configuration**:
  - **Site URL** → `http://localhost:3000` while developing,
    `https://deewars.in` (or your real domain) in production.
  - **Redirect URLs** → add `http://localhost:3000/auth/callback` and
    later `https://deewars.in/auth/callback`. This project's confirmation
    link is explicitly pointed at `/auth/callback` (see
    `src/app/auth/callback/route.ts`), which is what actually turns the
    email link into a signed-in session — without it in the allow-list,
    Supabase will refuse the redirect.

**When you're ready for production**, switch to your own SMTP provider so
emails are reliable and not rate-limited: Dashboard → **Authentication →
Emails → SMTP Settings**. Any transactional provider works — Resend,
Postmark, SendGrid, Brevo, AWS SES. You'll need, from whichever provider
you pick:

| From your email provider | Paste into Supabase's SMTP settings |
|---|---|
| SMTP host & port | Host / Port |
| SMTP username | Sender/Auth username |
| SMTP password or API key | Sender/Auth password |
| A verified sending domain | "Sender email" (e.g. `orders@deewars.in`) |

This is configured **entirely in the Supabase dashboard** — nothing to add
to `.env.local` for this part, since Supabase itself sends the email, not
your Next.js app.

---

## 2. Razorpay (payments)

### 2.1 Create an account
1. Go to [razorpay.com](https://razorpay.com) → sign up.
2. You can fully build and test in **Test Mode** without completing KYC.
   KYC (business documents, bank account) is only required before you can
   accept *real* payments and withdraw money — do this whenever you're
   ready to go live.

### 2.2 Get your API keys
1. Dashboard → **Settings → API Keys** → **Generate Test Key**.
2. You'll get a **Key Id** and **Key Secret** — copy both immediately
   (the secret is only shown once).

| Field                  | Paste into `.env.local` as         |
|-------------------------|--------------------------------------|
| Key Id                  | `NEXT_PUBLIC_RAZORPAY_KEY_ID`       |
| Key Secret (⚠️ secret)  | `RAZORPAY_KEY_SECRET`               |

### 2.3 Set up the webhook
This is what actually marks orders as paid reliably — even if a customer
closes the tab right after paying.

1. Dashboard → **Settings → Webhooks → Add New Webhook**.
2. **Webhook URL:**
   - Local testing: use a tunnel (e.g. `npx ngrok http 3000`) and set
     `https://<your-ngrok-subdomain>.ngrok.app/api/webhooks/razorpay`
   - Production: `https://deewars.in/api/webhooks/razorpay`
3. **Active events:** check `payment.captured` and `payment.failed`.
4. Save, then copy the **Webhook Secret** shown.

| Field            | Paste into `.env.local` as     |
|-------------------|-----------------------------------|
| Webhook Secret     | `RAZORPAY_WEBHOOK_SECRET`         |

### 2.4 Test a payment
Use Razorpay's test credentials — no real money moves:
- **Test card:** `4111 1111 1111 1111`, any future expiry date, any CVV.
- **Test UPI ID:** `success@razorpay` (always succeeds) or
  `failure@razorpay` (always fails, useful for testing error states).

### 2.5 Going live
Once you're ready to accept real payments:
1. Complete KYC in the Razorpay dashboard (business details, bank account,
   PAN, etc. — usually 1–2 business days for approval).
2. Switch the dashboard toggle from **Test Mode** to **Live Mode**.
3. Generate a new **Live** API key pair and a new **Live** webhook
   (webhooks are separate per mode) — replace the values in your
   production environment variables.

---

## 3. Put it all together

```bash
cp .env.local.example .env.local
```

Fill in every value in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx

SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Then:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. If a poster checkout completes and the order
shows up under **Admin panel → Orders** with status `paid`, everything is
wired correctly end to end.

### Deploying (e.g. to Vercel)
- Add the same environment variables in your host's dashboard
  (set `NEXT_PUBLIC_SITE_URL` to `https://deewars.in`).
- Update the Razorpay webhook URL to point at your live domain.
- Add your production domain to Supabase → **Authentication → URL
  Configuration → Redirect URLs** so login/signup email links work.

---

## Where each key is actually used (for reference)

| Key | File |
|---|---|
| Supabase URL + publishable key | `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts` |
| Supabase service role key | `src/lib/supabase/admin.ts` — server-only, used in `src/app/api/razorpay/*` and `src/app/actions/admin.ts` |
| Razorpay key id + secret | `src/lib/razorpay/server.ts` — used in `src/app/api/razorpay/create-order` |
| Razorpay webhook secret | `src/app/api/webhooks/razorpay/route.ts` — verifies the HMAC-SHA256 signature Razorpay sends |
