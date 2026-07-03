import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

function isMissingTableError(error: { code?: string | number | null; message?: string } | null): boolean {
  return (
    error?.code === "PGRST205" ||
    !!error?.message?.includes("Could not find the table") ||
    !!error?.message?.includes("schema cache")
  );
}

function logAuthError(message: string, error: { message?: string } | null) {
  console.error(`Auth error: ${message}${error?.message ? ` - ${error.message}` : ""}`);
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    logAuthError("Unable to get current user", error);
    return null;
  }
  return data?.user ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    logAuthError("Unable to get current user for profile lookup", userError);
    return null;
  }
  if (!userData?.user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    logAuthError("Failed to load profile", error);
    return null;
  }

  if (profile) return profile as Profile;

  const fullName =
    (userData.user.user_metadata as { full_name?: string })?.full_name ||
    null;

  const admin = createAdminClient();
  const { error: upsertError } = await admin.from("profiles").upsert({
    id: userData.user.id,
    full_name: fullName ?? null,
  });

  if (upsertError) {
    logAuthError("Failed to create profile", upsertError);
    return null;
  }

  const { data: createdProfile, error: createdProfileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (createdProfileError) {
    logAuthError("Failed to fetch profile after upsert", createdProfileError);
    return null;
  }

  return createdProfile as Profile | null;
}
