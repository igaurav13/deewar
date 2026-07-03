import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client — uses the service_role key and BYPASSES Row Level Security.
 *
 * ⚠️ Server-only. Never import this file from a Client Component or any
 * code path that could ship to the browser. Use it only inside:
 *   - Route Handlers (src/app/api/**)
 *   - Server Actions
 *   - Webhook handlers
 *
 * Typical uses: verifying a Razorpay webhook and writing the order status,
 * or admin dashboard mutations after independently checking profile.is_admin.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey || serviceRoleKey.startsWith("replace_with")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (Supabase Dashboard > Project Settings > API)."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
