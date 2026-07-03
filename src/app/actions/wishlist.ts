"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleWishlist(posterId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("poster_id", posterId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlist_items").delete().eq("id", existing.id);
    revalidatePath("/account/wishlist");
    return { wishlisted: false };
  } else {
    await supabase
      .from("wishlist_items")
      .insert({ user_id: user.id, poster_id: posterId });
    revalidatePath("/account/wishlist");
    return { wishlisted: true };
  }
}

export async function getWishlistedIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return [];

  const { data } = await supabase
    .from("wishlist_items")
    .select("poster_id")
    .eq("user_id", user.id);

  return (data ?? []).map((row) => row.poster_id as string);
}
