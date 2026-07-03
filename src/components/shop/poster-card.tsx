"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import type { Poster } from "@/types";
import { formatINR, cn } from "@/lib/utils";
import { toggleWishlist } from "@/app/actions/wishlist";

export function PosterCard({
  poster,
  isWishlisted = false,
  isLoggedIn = false,
  priority = false,
}: {
  poster: Poster;
  isWishlisted?: boolean;
  isLoggedIn?: boolean;
  priority?: boolean;
}) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [isPending, startTransition] = useTransition();

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    setWishlisted((w) => !w);
    startTransition(async () => {
      await toggleWishlist(poster.id);
    });
  }

  return (
    <Link
      href={`/poster/${poster.slug}`}
      className="group block frame-corners animate-fade-up"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-canvas rounded-sm border border-sand/60">
        <Image
          src={poster.image_url}
          alt={poster.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <button
          onClick={handleWishlist}
          disabled={isPending}
          aria-label={
            wishlisted ? "Remove from wishlist" : "Add to wishlist"
          }
          aria-pressed={wishlisted}
          className="absolute top-3 right-3 flex items-center justify-center size-9 rounded-full bg-paper/90 backdrop-blur-sm hover:bg-paper transition-colors cursor-pointer"
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              wishlisted ? "fill-clay text-clay" : "text-ink"
            )}
            strokeWidth={1.5}
          />
        </button>
        {poster.compare_at_price_cents && (
          <span className="absolute bottom-3 left-3 bg-clay text-paper text-xs px-2 py-1 rounded-sm font-medium">
            Sale
          </span>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{poster.title}</p>
          {poster.artist && (
            <p className="text-xs text-taupe mt-0.5">{poster.artist}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium">
            {formatINR(poster.price_cents)}
          </p>
          {poster.compare_at_price_cents && (
            <p className="text-xs text-taupe line-through">
              {formatINR(poster.compare_at_price_cents)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
