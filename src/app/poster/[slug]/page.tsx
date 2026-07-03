import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPosterBySlug, getRelatedPosters } from "@/lib/data/posters";
import { getWishlistedIds } from "@/app/actions/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { PosterGallery } from "@/components/shop/poster-gallery";
import { PosterPurchasePanel } from "@/components/shop/poster-purchase-panel";
import { PosterCard } from "@/components/shop/poster-card";
import { SectionHeading } from "@/components/ui/section-heading";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const poster = await getPosterBySlug(slug);
  if (!poster) return { title: "Poster not found" };
  return {
    title: `${poster.title} — Frame & Form`,
    description: poster.description ?? undefined,
  };
}

export default async function PosterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poster = await getPosterBySlug(slug);
  if (!poster) notFound();

  const [related, user] = await Promise.all([
    getRelatedPosters(poster.category_id, poster.id, 4),
    getCurrentUser(),
  ]);
  const wishlistedIds = user ? await getWishlistedIds() : [];

  const images = [poster.image_url, ...(poster.additional_images ?? [])];

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10 sm:py-14">
      <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
        <PosterGallery images={images} title={poster.title} />
        <PosterPurchasePanel
          poster={poster}
          isWishlisted={wishlistedIds.includes(poster.id)}
          isLoggedIn={!!user}
        />
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <SectionHeading
            eyebrow="Pairs well"
            title="You might also like"
            className="mb-10"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-10">
            {related.map((p) => (
              <PosterCard
                key={p.id}
                poster={p}
                isWishlisted={wishlistedIds.includes(p.id)}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
