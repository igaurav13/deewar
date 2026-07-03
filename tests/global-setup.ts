import { createClient } from "@supabase/supabase-js";
import { chromium, expect, type FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Runs once before the whole test suite.
 *
 * Uses the Supabase SERVICE ROLE key (server-only, never shipped to the
 * browser) to:
 *   1. Create a throwaway "customer" test user, pre-confirmed so login
 *      works immediately without clicking an email link.
 *   2. Create/reuse an "admin" test user and flip profiles.is_admin = true
 *      directly in the database — the same thing SETUP_KEYS.md tells a
 *      human to do by hand, just automated for CI.
 *   3. Logs both in with real Playwright browser sessions and saves the
 *      resulting storage state to disk, so individual spec files can reuse
 *      an authenticated session instead of re-logging-in every test.
 */

const STATE_DIR = path.join(__dirname, ".auth");

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? "http://localhost:3000";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "The test suite needs these to provision test accounts — put them in " +
        ".env.local (same values you use for the app itself)."
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const runId = Date.now();
  const customerEmail = `e2e.customer.${runId}@example.com`;
  const customerPassword = "TestPass123!";
  const adminEmail = process.env.TEST_ADMIN_EMAIL ?? `e2e.admin.${runId}@example.com`;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? "TestPass123!";

  // --- Customer account: always fresh, always pre-confirmed ---
  const { data: customerCreate, error: customerErr } =
    await admin.auth.admin.createUser({
      email: customerEmail,
      password: customerPassword,
      email_confirm: true,
      user_metadata: { full_name: "E2E Customer" },
    });
  if (customerErr || !customerCreate.user) {
    throw new Error(`Failed to create test customer: ${customerErr?.message}`);
  }

  const { error: schemaError } = await admin.from("profiles").select("id").limit(1);
  if (
    schemaError &&
    (schemaError.code === "PGRST205" ||
      schemaError.message?.includes("Could not find the table") ||
      schemaError.message?.includes("schema cache"))
  ) {
    throw new Error(
      "Supabase schema appears missing: public.profiles table was not found. " +
        "Run supabase/migrations/0001_init.sql or push migrations before running tests."
    );
  }

  const { error: customerProfileError } = await admin.from("profiles").upsert({
    id: customerCreate.user.id,
    full_name: "E2E Customer",
  });
  if (customerProfileError) {
    throw new Error(`Failed to create test customer profile: ${customerProfileError.message}`);
  }

  // --- Admin account: reuse if TEST_ADMIN_EMAIL already exists, else create ---
  let adminUserId: string;
  const { data: existing } = await admin.auth.admin.listUsers();
  const existingAdmin = existing.users.find((u) => u.email === adminEmail);

  if (existingAdmin) {
    adminUserId = existingAdmin.id;
    const { error: adminUpdateError } = await admin.auth.admin.updateUserById(adminUserId, {
      password: adminPassword,
    });
    if (adminUpdateError) {
      throw new Error(`Failed to update test admin password: ${adminUpdateError.message}`);
    }
  } else {
    const { data: adminCreate, error: adminErr } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: "E2E Admin" },
    });
    if (adminErr || !adminCreate.user) {
      throw new Error(`Failed to create test admin: ${adminErr?.message}`);
    }
    adminUserId = adminCreate.user.id;
  }

  const { error: adminProfileError } = await admin.from("profiles").upsert({
    id: adminUserId,
    full_name: "E2E Admin",
    is_admin: true,
  });
  if (adminProfileError) {
    throw new Error(`Failed to create test admin profile: ${adminProfileError.message}`);
  }

  // --- Save credentials for spec files to read ---
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STATE_DIR, "credentials.json"),
    JSON.stringify(
      { customerEmail, customerPassword, adminEmail, adminPassword },
      null,
      2
    )
  );

  // --- Log both accounts in via a real browser and persist storage state ---
  const browser = await chromium.launch();

  const customerContext = await browser.newContext({ baseURL });
  const customerPage = await customerContext.newPage();
  await customerPage.goto("/login");
  await customerPage.getByLabel("Email").fill(customerEmail);
  await customerPage.getByLabel("Password").fill(customerPassword);
  await customerPage.getByRole("button", { name: "Sign in" }).click();
  await expect(customerPage.getByLabel("Account menu")).toBeVisible({ timeout: 15000 });
  await customerContext.storageState({ path: path.join(STATE_DIR, "customer.json") });
  await customerContext.close();

  const adminContext = await browser.newContext({ baseURL });
  const adminPage = await adminContext.newPage();
  await adminPage.goto("/login");
  await adminPage.getByLabel("Email").fill(adminEmail);
  await adminPage.getByLabel("Password").fill(adminPassword);
  await adminPage.getByRole("button", { name: "Sign in" }).click();
  await expect(adminPage.getByLabel("Account menu")).toBeVisible({ timeout: 15000 });
  await adminContext.storageState({ path: path.join(STATE_DIR, "admin.json") });
  await adminContext.close();

  await browser.close();
}
