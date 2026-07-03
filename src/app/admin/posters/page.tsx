import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DeletePosterButton } from "@/components/admin/delete-poster-button";
import type { Poster } from "@/types";

export default async function AdminPostersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posters")
    .select("*, category:categories(*)")
    .order("created_at", { ascending: false });

  const posters = (data ?? []) as Poster[];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl">Posters ({posters.length})</h1>
        <Button>
          <Link href="/admin/posters/new" className="flex items-center gap-2">
            <Plus className="size-4" /> Add poster
          </Link>
        </Button>
      </div>

      <div className="border border-sand rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand-light text-left text-taupe text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Poster</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posters.map((poster) => (
              <tr key={poster.id} className="border-t border-sand">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 rounded-sm overflow-hidden bg-sand-light shrink-0">
                      {poster.image_url && (
                        <Image
                          src={poster.image_url}
                          alt={poster.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      )}
                    </div>
                    <span className="font-medium truncate max-w-[220px]">
                      {poster.title}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-taupe">
                  {poster.category?.name ?? "—"}
                </td>
                <td className="px-4 py-3">{formatINR(poster.price_cents)}</td>
                <td className="px-4 py-3">{poster.stock}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      poster.is_active
                        ? "text-success text-xs font-medium"
                        : "text-taupe text-xs font-medium"
                    }
                  >
                    {poster.is_active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/posters/${poster.id}/edit`}
                      className="p-2 hover:bg-sand-light rounded-sm transition-colors"
                      aria-label={`Edit ${poster.title}`}
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <DeletePosterButton posterId={poster.id} title={poster.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {posters.length === 0 && (
        <div className="border border-dashed border-sand rounded-sm py-16 text-center text-taupe mt-4">
          No posters yet. Add your first one.
        </div>
      )}
    </div>
  );
}
