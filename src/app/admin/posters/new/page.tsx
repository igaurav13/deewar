import { getCategories } from "@/lib/data/posters";
import { PosterForm } from "@/components/admin/poster-form";
import { createPoster } from "@/app/actions/admin";

export default async function NewPosterPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Add poster</h1>
      <PosterForm categories={categories} action={createPoster} />
    </div>
  );
}
