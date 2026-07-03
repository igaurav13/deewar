import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/types";

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  addItem: (line: CartLine) => void;
  removeItem: (posterId: string, sizeLabel: string) => void;
  updateQuantity: (
    posterId: string,
    sizeLabel: string,
    quantity: number
  ) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  subtotalCents: () => number;
  itemCount: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,

      addItem: (line) => {
        set((state) => {
          const existing = state.lines.find(
            (l) => l.posterId === line.posterId && l.sizeLabel === line.sizeLabel
          );
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l === existing
                  ? { ...l, quantity: l.quantity + line.quantity }
                  : l
              ),
            };
          }
          return { lines: [...state.lines, line] };
        });
      },

      removeItem: (posterId, sizeLabel) => {
        set((state) => ({
          lines: state.lines.filter(
            (l) => !(l.posterId === posterId && l.sizeLabel === sizeLabel)
          ),
        }));
      },

      updateQuantity: (posterId, sizeLabel, quantity) => {
        set((state) => ({
          lines: state.lines
            .map((l) =>
              l.posterId === posterId && l.sizeLabel === sizeLabel
                ? { ...l, quantity }
                : l
            )
            .filter((l) => l.quantity > 0),
        }));
      },

      clear: () => set({ lines: [] }),

      setOpen: (open) => set({ isOpen: open }),

      subtotalCents: () =>
        get().lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0),

      itemCount: () =>
        get().lines.reduce((sum, l) => sum + l.quantity, 0),
    }),
    {
      name: "poster-store-cart",
    }
  )
);
