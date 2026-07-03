"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, Check } from "lucide-react";
import type { Poster } from "@/types";
import { useCartStore } from "@/lib/store/cart";
import { formatINR, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/app/actions/wishlist";

export function PosterPurchasePanel({
  poster,
  isWishlisted,
  isLoggedIn,
}: {
  poster: Poster;
  isWishlisted: boolean;
  isLoggedIn: boolean;
}) {
  const sizes = poster.sizes?.length
    ? poster.sizes
    : [{ label: "Standard", price_cents: 0 }];
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const router = useRouter();

  const unitPrice = poster.price_cents + selectedSize.price_cents;

  function handleAddToCart() {
    addItem({
      posterId: poster.id,
      title: poster.title,
      slug: poster.slug,
      imageUrl: poster.image_url,
      sizeLabel: selectedSize.label,
      unitPriceCents: unitPrice,
      quantity,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
    setCartOpen(true);
  }

  async function handleWishlist() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setWishlisted((w) => !w);
    await toggleWishlist(poster.id);
  }

  const inStock = poster.stock > 0;

  return (
    <div>
      {poster.category && (
        <p className="text-xs uppercase tracking-[0.16em] text-clay font-medium mb-3">
          {poster.category.name}
        </p>
      )}
      <h1 className="font-display text-3xl sm:text-4xl text-balance">
        {poster.title}
      </h1>
      {poster.artist && (
        <p className="text-taupe mt-2">by {poster.artist}</p>
      )}

      <div className="mt-5 flex items-baseline gap-3">
        <p className="text-2xl font-medium">{formatINR(unitPrice)}</p>
        {poster.compare_at_price_cents && (
          <p className="text-taupe line-through">
            {formatINR(poster.compare_at_price_cents)}
          </p>
        )}
      </div>

      {poster.description && (
        <p className="mt-6 text-taupe leading-relaxed">{poster.description}</p>
      )}

      {/* Size selector */}
      <div className="mt-8">
        <p className="text-sm font-medium mb-3">Size</p>
        <div className="flex gap-2 flex-wrap">
          {sizes.map((size) => (
            <button
              key={size.label}
              onClick={() => setSelectedSize(size)}
              className={cn(
                "px-4 py-2 rounded-sm border text-sm transition-colors cursor-pointer",
                selectedSize.label === size.label
                  ? "border-ink bg-ink text-paper"
                  : "border-sand hover:border-ink"
              )}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity + actions */}
      <div className="mt-8 flex items-center gap-3">
        <div className="flex items-center border border-sand rounded-sm">
          <button
            aria-label="Decrease quantity"
            className="p-3 hover:bg-sand-light cursor-pointer"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus className="size-3.5" />
          </button>
          <span className="px-4 text-sm min-w-[2rem] text-center">
            {quantity}
          </span>
          <button
            aria-label="Increase quantity"
            className="p-3 hover:bg-sand-light cursor-pointer"
            onClick={() => setQuantity((q) => q + 1)}
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <Button
          size="lg"
          className="flex-1"
          disabled={!inStock}
          onClick={handleAddToCart}
        >
          {justAdded ? (
            <>
              <Check className="size-4" /> Added
            </>
          ) : inStock ? (
            "Add to cart"
          ) : (
            "Out of stock"
          )}
        </Button>

        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          className="flex items-center justify-center size-12 rounded-sm border border-sand hover:border-clay transition-colors cursor-pointer shrink-0"
        >
          <Heart
            className={cn(
              "size-5 transition-colors",
              wishlisted ? "fill-clay text-clay" : "text-ink"
            )}
            strokeWidth={1.5}
          />
        </button>
      </div>

      <dl className="mt-10 pt-8 border-t border-sand grid grid-cols-2 gap-y-3 text-sm">
        <dt className="text-taupe">Paper</dt>
        <dd>200gsm matte archival</dd>
        <dt className="text-taupe">Finish</dt>
        <dd>Unframed, ships rolled</dd>
        <dt className="text-taupe">Shipping</dt>
        <dd>3–5 business days</dd>
        <dt className="text-taupe">Stock</dt>
        <dd>{inStock ? `${poster.stock} available` : "Out of stock"}</dd>
      </dl>
    </div>
  );
}
