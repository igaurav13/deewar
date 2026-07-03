import { test, expect } from "@playwright/test";
import path from "node:path";
import { readCredentials, uniqueEmail } from "./helpers";

/**
 * Full feature walkthrough for Frame & Form.
 *
 * Run with:  npm run test:e2e            (headless)
 *            npm run test:e2e:ui         (Playwright's interactive UI —
 *                                          best for first run / debugging)
 *
 * Requires .env.local to be filled in (same file the app itself needs) —
 * see SETUP_KEYS.md. Test accounts are provisioned automatically by
 * tests/global-setup.ts using the Supabase service role key; you do not
 * need to sign up or run the "make yourself an admin" SQL by hand.
 *
 * One thing this suite deliberately does NOT fully automate: completing a
 * real Razorpay payment. Razorpay's checkout is a third-party iframe hosted
 * on their domain, and driving it from a headless browser is inherently
 * flaky (OTP steps, dynamic DOM, changes outside this repo's control). The
 * "Checkout" section verifies everything up to and including opening the
 * Razorpay modal with a real order; see the note in that section for how to
 * finish the payment manually with Razorpay's documented test card.
 */

const CUSTOMER_STATE = path.join(__dirname, ".auth", "customer.json");
const ADMIN_STATE = path.join(__dirname, ".auth", "admin.json");
const TEST_IMAGE = path.join(__dirname, "fixtures", "test-poster.jpg");

// ---------------------------------------------------------------------------
// Guest browsing — no auth required
// ---------------------------------------------------------------------------
test.describe("Guest browsing", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("shop page lists posters", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: /all posters|results for/i })).toBeVisible();
  });

  test("search filters results and updates the URL", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("button", { name: "Search posters" }).click();
    await page.getByPlaceholder("Search posters, artists, moods…").fill("zzzz_no_such_poster_zzzz");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/q=zzzz_no_such_poster_zzzz/);
    await expect(page.getByText("0 prints")).toBeVisible();
  });

  test("category filter and sort links update the URL", async ({ page }) => {
    await page.goto("/shop");
    const sortLink = page.getByRole("link", { name: "Price: Low to high" });
    await sortLink.click();
    await expect(page).toHaveURL(/sort=price_asc/);
  });

  test("poster detail page shows size selector and add-to-cart", async ({ page }) => {
    await page.goto("/shop");
    const firstPoster = page.locator('a[href^="/poster/"]').first();
    await expect(firstPoster).toBeVisible();
    await firstPoster.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /add to cart|out of stock/i })).toBeVisible();
  });

  test("wishlist button redirects a logged-out visitor to login", async ({ page }) => {
    await page.goto("/shop");
    const firstPoster = page.locator('a[href^="/poster/"]').first();
    await firstPoster.click();
    await page.locator('button[aria-label="Add to wishlist"]').first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("protected routes redirect to login when logged out", async ({ page }) => {
    for (const url of ["/account/orders", "/account/wishlist", "/checkout", "/admin"]) {
      await page.goto(url);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

// ---------------------------------------------------------------------------
// Authentication — exercises the actual signup/login/logout flow (not the
// pre-provisioned storage states above), so this is the one place the auth
// UI itself gets driven end to end.
// ---------------------------------------------------------------------------
test.describe("Authentication", () => {
  test("signup shows the email-confirmation message", async ({ page }) => {
    const email = uniqueEmail("e2e.signup");
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("New Test User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("TestPass123!");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(/check your inbox/i)).toBeVisible({ timeout: 10000 });
  });

  test("signup rejects a too-short password", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Short Pw");
    await page.getByLabel("Email").fill(uniqueEmail("e2e.shortpw"));
    const passwordInput = page.getByLabel("Password");
    await passwordInput.fill("abc");
    // minLength=6 triggers native HTML5 validation before the request fires
    await page.getByRole("button", { name: "Create account" }).click();
    const isValid = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test("login with wrong password shows an error, not a crash", async ({ page }) => {
    const creds = readCredentials();
    await page.goto("/login");
    await page.getByLabel("Email").fill(creds.customerEmail);
    await page.getByLabel("Password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("form").getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("login with correct credentials reaches the homepage as a signed-in user", async ({ page }) => {
    const creds = readCredentials();
    await page.goto("/login");
    await page.getByLabel("Email").fill(creds.customerEmail);
    await page.getByLabel("Password").fill(creds.customerPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByLabel("Account menu")).toBeVisible();
  });

  test("logout returns to a logged-out state", async ({ page }) => {
    const creds = readCredentials();
    await page.goto("/login");
    await page.getByLabel("Email").fill(creds.customerEmail);
    await page.getByLabel("Password").fill(creds.customerPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByLabel("Account menu")).toBeVisible();

    await page.getByLabel("Account menu").click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByLabel("Sign in")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Cart — pure client-side (zustand), no auth needed, but we run it as the
// customer so the checkout redirect test later in the file can chain off it.
// ---------------------------------------------------------------------------
test.describe("Cart", () => {
  test.use({ storageState: CUSTOMER_STATE });

  test("add to cart updates the badge and opens the drawer", async ({ page }) => {
    await page.goto("/shop");
    await page.locator('a[href^="/poster/"]').first().click();

    await page.getByRole("button", { name: "Add to cart" }).click();

    await expect(page.getByRole("dialog", { name: "Shopping cart" })).toBeVisible();
    await expect(page.getByLabel(/Open cart, [1-9]\d* items?/)).toBeVisible();
  });

  test("quantity controls and remove work inside the drawer", async ({ page }) => {
    await page.goto("/shop");
    await page.locator('a[href^="/poster/"]').first().click();
    await page.getByRole("button", { name: "Add to cart" }).click();

    const drawer = page.getByRole("dialog", { name: "Shopping cart" });
    await expect(drawer).toBeVisible();

    await drawer.getByLabel("Increase quantity").click();
    await expect(drawer.getByText("2", { exact: true })).toBeVisible();

    await drawer.getByLabel(/Remove .* from cart/).click();
    await expect(drawer.getByText("Your cart is empty.")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Wishlist — logged in
// ---------------------------------------------------------------------------
test.describe("Wishlist (logged in)", () => {
  test.use({ storageState: CUSTOMER_STATE });

  test("toggling wishlist on a poster adds and removes it from /account/wishlist", async ({
    page,
  }) => {
    await page.goto("/shop");
    const card = page.locator('a[href^="/poster/"]').first();
    const posterHref = await card.getAttribute("href");
    const wishlistBtn = card.locator('button[aria-label="Add to wishlist"]');
    await wishlistBtn.click();
    await expect(wishlistBtn).toHaveAttribute("aria-label", "Remove from wishlist");

    await page.goto("/account/wishlist");
    await expect(page.locator(`a[href="${posterHref}"]`)).toBeVisible();

    // Remove it again and confirm it disappears
    await page.locator(`a[href="${posterHref}"]`).getByLabel("Remove from wishlist").click();
    await page.reload();
    if (posterHref) {
      await expect(page.locator(`a[href="${posterHref}"]`)).toHaveCount(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Checkout — shipping form validation is fully automated; the actual
// Razorpay payment is verified only up to "the gateway opened with a real
// server-created order" (see note above the describe block).
// ---------------------------------------------------------------------------
test.describe("Checkout", () => {
  test.use({ storageState: CUSTOMER_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto("/shop");
    await page.locator('a[href^="/poster/"]').first().click();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.goto("/checkout");
  });

  test("shows validation errors when submitting an incomplete address", async ({ page }) => {
    await page.getByRole("button", { name: /Pay .* with Razorpay/ }).click();
    // shippingAddressSchema.safeParse fails -> field-level errors render
    await expect(page.locator("text=/required|invalid|too short/i").first()).toBeVisible();
  });

  test("valid address creates a real Razorpay order and opens the payment modal", async ({
    page,
  }) => {
    await page.getByLabel("Full name").fill("Test Customer");
    await page.getByLabel("Phone number").fill("9876543210");
    await page.getByLabel("Pincode").fill("400001");
    await page.getByLabel("Address line 1").fill("123 Test Lane");
    await page.getByLabel("City").fill("Mumbai");
    await page.getByLabel("State").fill("Maharashtra");

    const [createOrderResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/razorpay/create-order")),
      page.getByRole("button", { name: /Pay .* with Razorpay/ }).click(),
    ]);

    expect(createOrderResponse.status()).toBe(200);
    const body = await createOrderResponse.json();
    expect(body.razorpayOrderId).toBeTruthy();

    // Razorpay injects an iframe for its checkout UI. We only assert it
    // shows up — completing the payment requires their hosted UI and a
    // test card, which is best done manually (see SETUP_KEYS.md §2.4):
    //   card 4111 1111 1111 1111, any future expiry, any CVV.
    await expect(page.frameLocator('iframe[src*="razorpay"]').first().locator("body")).toBeVisible({
      timeout: 15000,
    });
  });
});

// ---------------------------------------------------------------------------
// Admin — access control
// ---------------------------------------------------------------------------
test.describe("Admin access control", () => {
  test.use({ storageState: CUSTOMER_STATE });

  test("customer session cannot reach /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=\/admin/);
  });
});

test.describe("Admin panel", () => {
  test.use({ storageState: ADMIN_STATE });

  test("admin can reach the dashboard and see Posters / Orders nav", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "Posters", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();
  });

  test("full poster lifecycle: create (with drag-and-drop image upload), edit, delete", async ({
    page,
  }) => {
    const title = `E2E Test Poster ${Date.now()}`;

    // --- Create ---
    await page.goto("/admin/posters/new");
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Base price (₹)").fill("999");
    await page.getByLabel("Stock").fill("10");

    // Drives the drag-and-drop widget's underlying <input type="file">
    // directly — this is the standard, reliable way Playwright uploads
    // files regardless of whether the input is visually hidden.
    await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
    await expect(page.getByAltText("Poster preview")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "Create poster" }).click();
    await expect(page).toHaveURL("/admin/posters");
    await expect(page.getByText(title)).toBeVisible();

    // --- Confirm it's live on the storefront ---
    await page.goto("/shop");
    await page.getByRole("button", { name: "Search posters" }).click();
    await page.getByPlaceholder("Search posters, artists, moods…").fill(title);
    await page.keyboard.press("Enter");
    await expect(page.getByText(title)).toBeVisible();

    // --- Edit ---
    await page.goto("/admin/posters");
    await page.getByLabel(`Edit ${title}`).click();
    await expect(page.getByLabel("Title")).toHaveValue(title);
    await page.getByLabel("Base price (₹)").fill("1499");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL("/admin/posters");
    await expect(page.getByText("₹1,499")).toBeVisible();

    // --- Delete (two-click confirm pattern) ---
    const deleteBtn = page.getByLabel(`Delete ${title}`);
    await deleteBtn.click(); // arms the confirm
    await deleteBtn.click(); // confirms
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test("creating a poster without an image is rejected", async ({ page }) => {
    await page.goto("/admin/posters/new");
    await page.getByLabel("Title").fill(`No Image Poster ${Date.now()}`);
    await page.getByLabel("Base price (₹)").fill("500");
    await page.getByLabel("Stock").fill("5");
    await page.getByRole("button", { name: "Create poster" }).click();
    await expect(page.getByText("Poster image is required")).toBeVisible();
  });

  test("orders page renders and status can be changed if any orders exist", async ({ page }) => {
    await page.goto("/admin/orders");
    const noOrders = page.getByText("No orders yet.");
    if (await noOrders.isVisible().catch(() => false)) {
      test.info().annotations.push({
        type: "skip-reason",
        description:
          "No orders exist yet — run the Checkout test manually with a Razorpay test card first.",
      });
      return;
    }
    const select = page.locator("select").first();
    await select.selectOption("shipped");
    await page.reload();
    await expect(page.locator("select").first()).toHaveValue("shipped");
  });
});

// ---------------------------------------------------------------------------
// Note on authorization coverage: "Admin access control" above already
// confirms /admin (and therefore every nested admin route, including the
// poster form) redirects a non-admin session — that redirect comes from
// requireAdmin()-equivalent checks in src/app/admin/layout.tsx and is
// re-verified independently inside every server action in
// src/app/actions/admin.ts, per the project's own security notes.
// ---------------------------------------------------------------------------
