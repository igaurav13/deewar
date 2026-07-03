import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data/posters";
import { PosterForm } from "@/components/admin/poster-form";
import { updatePoster } from "@/app/actions/admin";
import type { Poster } from "@/types";

export default async function EditPosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: poster }, categories] = await Promise.all([
    supabase.from("posters").select("*").eq("id", id).single(),
    getCategories(),
  ]);

  if (!poster) notFound();

  const boundAction = updatePoster.bind(null, id);

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Edit poster</h1>
      <PosterForm
        categories={categories}
        poster={poster as Poster}
        action={boundAction}
      />
    </div>
  );
}
