"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSyncExternalStore } from "react";

function emptySubscribe() {
  return () => {};
}

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const lines = useCartStore((s) => s.lines);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotalCents());

  // Server snapshot is false so SSR markup renders nothing client-only;
  // after hydration the client snapshot flips this to true automatically,
  // without an extra render-effect setState call.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-ink/30 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-paper z-50 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-sand">
          <h2 className="font-display text-lg">Your cart</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="cursor-pointer p-1 hover:text-clay transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-taupe">Your cart is empty.</p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              <Link href="/shop">Browse posters</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">
              {lines.map((line) => (
                <div
                  key={`${line.posterId}-${line.sizeLabel}`}
                  className="flex gap-4"
                >
                  <div className="relative size-20 shrink-0 rounded-sm overflow-hidden bg-sand-light">
                    <Image
                      src={line.imageUrl}
                      alt={line.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{line.title}</p>
                    <p className="text-xs text-taupe mt-0.5">{line.sizeLabel}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-sand rounded-sm">
                        <button
                          aria-label="Decrease quantity"
                          className="p-1.5 hover:bg-sand-light cursor-pointer"
                          onClick={() =>
                            updateQuantity(
                              line.posterId,
                              line.sizeLabel,
                              line.quantity - 1
                            )
                          }
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="px-2 text-sm min-w-[1.5rem] text-center">
                          {line.quantity}
                        </span>
                        <button
                          aria-label="Increase quantity"
                          className="p-1.5 hover:bg-sand-light cursor-pointer"
                          onClick={() =>
                            updateQuantity(
                              line.posterId,
                              line.sizeLabel,
                              line.quantity + 1
                            )
                          }
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <p className="text-sm font-medium">
                        {formatINR(line.unitPriceCents * line.quantity)}
                      </p>
                    </div>
                  </div>
                  <button
                    aria-label={`Remove ${line.title} from cart`}
                    className="self-start p-1 text-taupe hover:text-error transition-colors cursor-pointer"
                    onClick={() => removeItem(line.posterId, line.sizeLabel)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-sand px-6 py-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-taupe">Subtotal</span>
                <span className="font-medium">{formatINR(subtotal)}</span>
              </div>
              <p className="text-xs text-taupe">
                Shipping and taxes calculated at checkout.
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setOpen(false)}
              >
                <Link href="/checkout" className="w-full">
                  Checkout
                </Link>
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
