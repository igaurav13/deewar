import { createAdminClient } from "@/lib/supabase/admin";
import type { CartLine, Poster } from "@/types";

export const SHIPPING_THRESHOLD_CENTS = 200000; // ₹2,000
export const FLAT_SHIPPING_CENTS = 9900; // ₹99

export type PricedLine = {
  posterId: string;
  title: string;
  slug: string;
  imageUrl: string;
  sizeLabel: string;
  unitPriceCents: number; // server-verified, NOT trusted from client
  quantity: number;
};

export type PricingResult = {
  lines: PricedLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

/**
 * Recomputes authoritative prices server-side from the database.
 * Client-submitted unitPriceCents values are IGNORED — only posterId,
 * sizeLabel, and quantity are trusted from the request. This prevents
 * a tampered client from checking out at an arbitrary price.
 */
export async function priceCart(
  clientLines: Pick<CartLine, "posterId" | "sizeLabel" | "quantity">[]
): Promise<PricingResult> {
  const admin = createAdminClient();
  const posterIds = [...new Set(clientLines.map((l) => l.posterId))];

  const { data: posters, error } = await admin
    .from("posters")
    .select("*")
    .in("id", posterIds)
    .eq("is_active", true);

  if (error) throw new Error("Failed to load posters for pricing");

  const postersById = new Map<string, Poster>(
    (posters ?? []).map((p) => [p.id, p as Poster])
  );

  const lines: PricedLine[] = [];

  for (const line of clientLines) {
    const poster = postersById.get(line.posterId);
    if (!poster) {
      throw new Error(`Poster ${line.posterId} not found or unavailable`);
    }
    if (line.quantity > poster.stock) {
      throw new Error(`Only ${poster.stock} left of "${poster.title}"`);
    }

    const sizeDef = (poster.sizes ?? []).find(
      (s) => s.label === line.sizeLabel
    );
    if (!sizeDef) {
      throw new Error(`Invalid size "${line.sizeLabel}" for "${poster.title}"`);
    }

    const unitPriceCents = poster.price_cents + sizeDef.price_cents;

    lines.push({
      posterId: poster.id,
      title: poster.title,
      slug: poster.slug,
      imageUrl: poster.image_url,
      sizeLabel: line.sizeLabel,
      unitPriceCents,
      quantity: line.quantity,
    });
  }

  const subtotalCents = lines.reduce(
    (sum, l) => sum + l.unitPriceCents * l.quantity,
    0
  );
  const shippingCents =
    subtotalCents >= SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  const totalCents = subtotalCents + shippingCents;

  return { lines, subtotalCents, shippingCents, totalCents };
}
