import { createClient } from "@/lib/supabase/server";
import type { Poster, Category } from "@/types";

export type PosterFilters = {
  q?: string;
  category?: string; // category slug
  sort?: "newest" | "price_asc" | "price_desc" | "featured";
  page?: number;
  pageSize?: number;
};

export async function getPosters(filters: PosterFilters = {}) {
  const supabase = await createClient();
  const { q, category, sort = "featured", page = 1, pageSize = 12 } = filters;

  let query = supabase
    .from("posters")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("is_active", true);

  if (q) {
    query = query.textSearch("title", q, {
      type: "websearch",
      config: "english",
    });
  }

  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  switch (sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "price_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("getPosters error:", error.message);
    return { posters: [] as Poster[], count: 0 };
  }

  return { posters: (data ?? []) as Poster[], count: count ?? 0 };
}

export async function getFeaturedPosters(limit = 8) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posters")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedPosters error:", error.message);
    return [] as Poster[];
  }
  return (data ?? []) as Poster[];
}

export async function getPosterBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posters")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data as Poster;
}

export async function getRelatedPosters(categoryId: string | null, excludeId: string, limit = 4) {
  const supabase = await createClient();
  let query = supabase
    .from("posters")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .neq("id", excludeId)
    .limit(limit);

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data } = await query;
  return (data ?? []) as Poster[];
}

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("getCategories error:", error.message);
    return [] as Category[];
  }
  return (data ?? []) as Category[];
}
