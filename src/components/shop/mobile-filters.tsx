"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Category } from "@/types";
import { ShopFilters } from "@/components/shop/shop-filters";

export function MobileFilters({
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
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden mb-6">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm border border-sand rounded-full px-4 py-2 cursor-pointer"
      >
        <SlidersHorizontal className="size-3.5" />
        Filter &amp; sort
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-ink/30 z-50"
            onClick={() => setOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-paper z-50 rounded-t-lg p-6 max-h-[80vh] overflow-y-auto animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <p className="font-display text-lg">Filter &amp; sort</p>
              <button onClick={() => setOpen(false)} className="cursor-pointer">
                <X className="size-5" />
              </button>
            </div>
            <ShopFilters
              categories={categories}
              activeCategory={activeCategory}
              activeSort={activeSort}
              query={query}
            />
          </div>
        </>
      )}
    </div>
  );
}
