"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import type { PosterSize } from "@/types";

/**
 * Every admin action re-checks profiles.is_admin itself. The /admin layout
 * redirect is a UX nicety, not a security boundary — server actions can be
 * invoked directly, so each one must enforce authorization on its own.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Not authorized");
  return user;
}

export type PosterFormState = {
  error?: string;
};

function parseSizes(raw: string): PosterSize[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error();
    return parsed.map((s) => ({
      label: String(s.label),
      price_cents: Number(s.price_cents) || 0,
    }));
  } catch {
    return [{ label: "A3", price_cents: 0 }];
  }
}

export async function createPoster(
  _prev: PosterFormState,
  formData: FormData
): Promise<PosterFormState> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { error: "Title is required" };

    const imageUrl = String(formData.get("image_url") ?? "").trim();
    if (!imageUrl) return { error: "Poster image is required" };

    const priceRupees = Number(formData.get("price") ?? 0);
    const compareAtRupees = Number(formData.get("compare_at_price") ?? 0);

    const { error } = await admin.from("posters").insert({
      title,
      slug: slugify(title) + "-" + Math.random().toString(36).slice(2, 7),
      description: String(formData.get("description") ?? ""),
      artist: String(formData.get("artist") ?? ""),
      price_cents: Math.round(priceRupees * 100),
      compare_at_price_cents: compareAtRupees
        ? Math.round(compareAtRupees * 100)
        : null,
      category_id: String(formData.get("category_id") ?? "") || null,
      image_url: imageUrl,
      sizes: parseSizes(String(formData.get("sizes") ?? "[]")),
      stock: Number(formData.get("stock") ?? 0),
      is_featured: formData.get("is_featured") === "on",
      is_active: formData.get("is_active") !== "off",
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    if (error) return { error: error.message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create poster" };
  }

  revalidatePath("/admin/posters");
  revalidatePath("/shop");
  redirect("/admin/posters");
}

export async function updatePoster(
  posterId: string,
  _prev: PosterFormState,
  formData: FormData
): Promise<PosterFormState> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { error: "Title is required" };

    const imageUrl = String(formData.get("image_url") ?? "").trim();
    if (!imageUrl) return { error: "Poster image is required" };

    const priceRupees = Number(formData.get("price") ?? 0);
    const compareAtRupees = Number(formData.get("compare_at_price") ?? 0);

    const { error } = await admin
      .from("posters")
      .update({
        title,
        description: String(formData.get("description") ?? ""),
        artist: String(formData.get("artist") ?? ""),
        price_cents: Math.round(priceRupees * 100),
        compare_at_price_cents: compareAtRupees
          ? Math.round(compareAtRupees * 100)
          : null,
        category_id: String(formData.get("category_id") ?? "") || null,
        image_url: imageUrl,
        sizes: parseSizes(String(formData.get("sizes") ?? "[]")),
        stock: Number(formData.get("stock") ?? 0),
        is_featured: formData.get("is_featured") === "on",
        is_active: formData.get("is_active") !== "off",
        tags: String(formData.get("tags") ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      })
      .eq("id", posterId);

    if (error) return { error: error.message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update poster" };
  }

  revalidatePath("/admin/posters");
  revalidatePath("/shop");
  redirect("/admin/posters");
}

export async function deletePoster(posterId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("posters").delete().eq("id", posterId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/posters");
  revalidatePath("/shop");
}

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
}
