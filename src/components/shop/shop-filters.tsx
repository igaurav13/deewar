import Link from "next/link";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

export function ShopFilters({
  categories,
  activeCategory,
  activeSort,
  query,
}: {
  categories: Category[];
  activeCategory?: string;
  activeSort: string;
  query?: string;
}) {
  function buildHref(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (params.category ?? activeCategory) {
      const cat = params.category !== undefined ? params.category : activeCategory;
      if (cat) sp.set("category", cat);
    }
    if (params.sort ?? activeSort) {
      const sort = params.sort !== undefined ? params.sort : activeSort;
      if (sort && sort !== "featured") sp.set("sort", sort);
    }
    const str = sp.toString();
    return str ? `/shop?${str}` : "/shop";
  }

  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low to high" },
    { value: "price_desc", label: "Price: High to low" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-taupe font-medium mb-3">
          Category
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href={buildHref({ category: undefined })}
              className={cn(
                "hover:text-clay transition-colors",
                !activeCategory && "text-clay font-medium"
              )}
            >
              All posters
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={buildHref({ category: cat.slug })}
                className={cn(
                  "hover:text-clay transition-colors",
                  activeCategory === cat.slug && "text-clay font-medium"
                )}
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-taupe font-medium mb-3">
          Sort by
        </p>
        <ul className="space-y-2 text-sm">
          {sortOptions.map((opt) => (
            <li key={opt.value}>
              <Link
                href={buildHref({ sort: opt.value })}
                className={cn(
                  "hover:text-clay transition-colors",
                  activeSort === opt.value && "text-clay font-medium"
                )}
              >
                {opt.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
