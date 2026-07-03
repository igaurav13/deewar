import Link from "next/link";
import { getPosters, getCategories } from "@/lib/data/posters";
import { getWishlistedIds } from "@/app/actions/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { PosterCard } from "@/components/shop/poster-card";
import { ShopFilters } from "@/components/shop/shop-filters";
import { MobileFilters } from "@/components/shop/mobile-filters";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sort = (params.sort ?? "featured") as
    | "newest"
    | "price_asc"
    | "price_desc"
    | "featured";

  const [{ posters, count }, categories, user] = await Promise.all([
    getPosters({
      q: params.q,
      category: params.category,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    getCategories(),
    getCurrentUser(),
  ]);
  const wishlistedIds = user ? await getWishlistedIds() : [];
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.category) sp.set("category", params.category);
    if (params.sort) sp.set("sort", params.sort);
    sp.set("page", String(p));
    return `/shop?${sp.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10 sm:py-14">
      <div className="mb-10">
        <h1 className="font-display text-3xl sm:text-4xl">
          {params.q ? `Results for “${params.q}”` : "All posters"}
        </h1>
        <p className="text-taupe mt-2 text-sm">
          {count} {count === 1 ? "print" : "prints"}
        </p>
      </div>

      <MobileFilters
        categories={categories}
        activeCategory={params.category}
        activeSort={sort}
        query={params.q}
      />

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10">
        <aside className="hidden md:block">
          <ShopFilters
            categories={categories}
            activeCategory={params.category}
            activeSort={sort}
            query={params.q}
          />
        </aside>

        <div>
          {posters.length === 0 ? (
            <div className="border border-dashed border-sand rounded-sm py-20 text-center text-taupe">
              <p>No posters match your search.</p>
              <Link href="/shop" className="text-clay hover:underline text-sm mt-2 inline-block">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-10">
              {posters.map((poster, i) => (
                <PosterCard
                  key={poster.id}
                  poster={poster}
                  isWishlisted={wishlistedIds.includes(poster.id)}
                  isLoggedIn={!!user}
                  priority={i < 3}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-16">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageHref(p)}
                  className={cn(
                    "size-9 flex items-center justify-center rounded-full text-sm border border-sand hover:border-clay transition-colors",
                    p === page && "bg-ink text-paper border-ink"
                  )}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
