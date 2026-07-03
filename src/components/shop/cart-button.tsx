"use client";

import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useSyncExternalStore } from "react";

// Subscribing via useSyncExternalStore (rather than useEffect+setState) avoids
// the hydration-mismatch issue cleanly: the server snapshot is always 0, and
// the client snapshot reads the persisted store, with no extra render-effect.
function emptySubscribe() {
  return () => {};
}

export function CartButton() {
  const setOpen = useCartStore((s) => s.setOpen);
  const itemCount = useCartStore((s) => s.itemCount());
  // On the server (and on the very first client render before hydration),
  // report 0 so markup matches; after hydration, React re-renders with the
  // real client snapshot automatically.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <button
      onClick={() => setOpen(true)}
      aria-label={`Open cart, ${itemCount} items`}
      className="relative flex items-center justify-center size-10 rounded-full hover:bg-sand-light transition-colors cursor-pointer"
    >
      <ShoppingBag className="size-5" strokeWidth={1.5} />
      {mounted && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-clay text-[10px] font-semibold text-paper">
          {itemCount}
        </span>
      )}
    </button>
  );
}
