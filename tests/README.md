# Testing — Frame & Form

End-to-end tests using [Playwright](https://playwright.dev), driving a real
browser against your actual app, your actual Supabase project, and your
actual Razorpay test-mode account. Nothing is mocked — if a test passes,
that feature genuinely works.

## What's covered

| Area | File section |
|---|---|
| Guest browsing (home, shop, search, filters, sort, poster detail) | `Guest browsing` |
| Protected-route redirects when logged out | `Guest browsing` |
| Signup, invalid-password rejection, login, wrong-password error, logout | `Authentication` |
| Add to cart, quantity +/-, remove, cart badge, drawer | `Cart` |
| Wishlist add/remove, persists to `/account/wishlist` | `Wishlist (logged in)` |
| Checkout form validation, real Razorpay order creation + modal opening | `Checkout` |
| Admin route protection for non-admins | `Admin access control` |
| Full poster CRUD incl. the drag-and-drop image upload, image-required validation | `Admin panel` |
| Admin order status updates | `Admin panel` |

**Not fully automated:** completing an actual Razorpay payment. Their
checkout is a hosted iframe on `razorpay.com`, and driving it headlessly is
inherently flaky and outside this repo's control. The checkout test
confirms your app creates a real order and Razorpay's modal opens; to
finish a payment and see the order-confirmation page + order history +
admin order list actually populate, do one manual run:

```bash
npm run dev
```

Add something to cart → checkout → pay with test card `4111 1111 1111 1111`
(any future expiry, any CVV) or test UPI `success@razorpay`. After that,
re-run the suite — the "orders page" test will now exercise the status
dropdown against a real order instead of skipping.

## One-time setup

1. You need a working `.env.local` — same one the app itself needs (see
   `SETUP_KEYS.md`). The test suite specifically needs:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` — used **only** by `tests/global-setup.ts`,
     on your machine, to create test accounts. Never sent to the browser.
2. Install Playwright's browser binary (one-time, ~300MB):

   ```bash
   npx playwright install chromium
   ```

## Running

```bash
npm run test:e2e          # headless, CI-style
npm run test:e2e:ui       # Playwright's interactive UI — start here
npm run test:e2e:report   # reopen the last HTML report (screenshots, traces, video on failure)
```

`webServer` in `playwright.config.ts` will start `npm run dev` for you if
nothing's already running on `NEXT_PUBLIC_SITE_URL`, and reuse it if
something is — so `npm run dev` in one terminal + `npm run test:e2e:ui` in
another is the fastest loop.

## How test accounts work

`tests/global-setup.ts` runs once before the suite and, using your service
role key:

- creates a fresh, pre-confirmed **customer** account every run (so signup
  email confirmation never blocks the login tests)
- creates (or reuses, if you set `TEST_ADMIN_EMAIL`/`TEST_ADMIN_PASSWORD`)
  an **admin** account and flips `profiles.is_admin = true` directly — the
  automated equivalent of the SQL step in `SETUP_KEYS.md`

It then logs both in with a real browser and saves the session to
`tests/.auth/*.json`, which the spec file reuses via `test.use({ storageState })`
so most tests don't waste time re-logging-in. This directory is gitignored
— it contains live session cookies.

If you'd rather point tests at a fixed admin account you already made
admin by hand, set:

```env
TEST_ADMIN_EMAIL=you@example.com
TEST_ADMIN_PASSWORD=whatever-you-set-in-supabase
```

## Running against a deployed site instead of local dev

```bash
NEXT_PUBLIC_SITE_URL=https://deewars.in PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e
```

Be aware the poster-CRUD test **creates and deletes a real poster** and the
checkout test **creates a real Razorpay order** — fine against test-mode
keys, not something you want pointed at production Razorpay live keys.
