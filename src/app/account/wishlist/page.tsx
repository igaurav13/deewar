import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PosterCard } from "@/components/shop/poster-card";
import type { Poster, WishlistItem } from "@/types";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/wishlist");

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("wishlist_items")
    .select("*, poster:posters(*, category:categories(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const wishlistItems = (items ?? []) as (WishlistItem & { poster: Poster })[];
  const posters = wishlistItems.filter((i) => i.poster).map((i) => i.poster);

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10 sm:py-14">
      <h1 className="font-display text-3xl mb-10">Your wishlist</h1>

      {posters.length === 0 ? (
        <div className="border border-dashed border-sand rounded-sm py-20 text-center text-taupe">
          <p>Nothing saved yet.</p>
          <Link href="/shop" className="text-clay hover:underline text-sm mt-2 inline-block">
            Browse posters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {posters.map((poster) => (
            <PosterCard
              key={poster.id}
              poster={poster}
              isWishlisted={true}
              isLoggedIn={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
