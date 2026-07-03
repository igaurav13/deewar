import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getFeaturedPosters, getCategories } from "@/lib/data/posters";
import { getWishlistedIds } from "@/app/actions/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { PosterCard } from "@/components/shop/poster-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";

// Curated static mosaic for the hero — always looks great regardless of
// what's currently in the catalog. Swap these out any time via the files
// in /public/images/hero.
const HERO_MOSAIC = [
  {
    src: "/images/hero/quilled-elephant.jpg",
    alt: "Quilled-paper elephant art print",
    className: "left-[6%] top-2 w-[34%] rotate-[-4deg] z-10",
  },
  {
    src: "/images/hero/monk-bonsai.jpg",
    alt: "Minimalist monk and bonsai print",
    className: "left-0 top-[38%] w-[30%] rotate-[3deg] z-20",
  },
  {
    src: "/images/hero/chaplin-popart.jpg",
    alt: "Charlie Chaplin pop-art poster",
    className: "right-[4%] top-0 w-[36%] rotate-[3deg] z-10",
  },
  {
    src: "/images/hero/wolf-money.jpg",
    alt: "Wolf of Wall Street inspired poster",
    className: "right-0 top-[34%] w-[32%] rotate-[-3deg] z-30",
  },
  {
    src: "/images/hero/varanasi-boat.jpg",
    alt: "Varanasi ghats boatman illustration",
    className: "left-[24%] bottom-0 w-[30%] rotate-[2deg] z-0",
  },
] as const;

export default async function HomePage() {
  const [featured, categories, user] = await Promise.all([
    getFeaturedPosters(8),
    getCategories(),
    getCurrentUser(),
  ]);
  const wishlistedIds = user ? await getWishlistedIds() : [];

  return (
    <div>
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden border-b border-sand">
        {/* Faint full-bleed backdrop collage for texture behind the copy */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] grid grid-cols-4 sm:grid-cols-6"
        >
          {[
            "/images/hero/distraction-ali.jpg",
            "/images/hero/never-too-late.jpg",
            "/images/hero/eightball-eye.jpg",
            "/images/hero/ustaad-women.jpg",
            "/images/hero/quilled-elephant.jpg",
            "/images/hero/chaplin-popart.jpg",
          ].map((src) => (
            <div key={src} className="relative aspect-[3/4]">
              <Image src={src} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <p className="text-xs uppercase tracking-[0.18em] text-clay font-medium mb-5">
              New drop — 24 prints
            </p>
            <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] text-balance">
              Walls deserve better than blank.
            </h1>
            <p className="mt-6 text-taupe text-lg leading-relaxed max-w-md">
              Museum-grade poster prints across minimal, pop-art, abstract
              and typographic styles — designed in small batches,
              framed-ready, shipped across India.
            </p>
            <div className="mt-9 flex items-center gap-4">
              <Button size="lg">
                <Link href="/shop" className="flex items-center gap-2">
                  Shop the collection <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg">
                <Link href="/shop?sort=newest">New arrivals</Link>
              </Button>
            </div>
          </div>

          {/* Offset gallery-wall hero mosaic */}
          <div className="relative h-[420px] sm:h-[520px] hidden sm:block">
            {HERO_MOSAIC.map((item, i) => (
              <div
                key={item.src}
                className={`absolute aspect-[3/4] rounded-sm overflow-hidden shadow-xl border border-sand/60 bg-canvas transition-transform duration-300 hover:rotate-0 hover:scale-[1.03] hover:shadow-2xl ${item.className}`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  priority={i < 2}
                  sizes="20vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Category strip ---- */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="shrink-0 px-5 py-2.5 rounded-full border border-sand text-sm hover:border-clay hover:text-clay transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---- Featured grid ---- */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-12 sm:py-16">
        <div className="flex items-end justify-between mb-10 gap-4">
          <SectionHeading
            eyebrow="Curated"
            title="Featured prints"
            description="A rotating edit of what's resonating on walls right now."
          />
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1.5 text-sm text-clay hover:underline shrink-0"
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="border border-dashed border-sand rounded-sm py-20 text-center text-taupe">
            <p>No posters yet — add some from the admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {featured.map((poster, i) => (
              <PosterCard
                key={poster.id}
                poster={poster}
                isWishlisted={wishlistedIds.includes(poster.id)}
                isLoggedIn={!!user}
                priority={i < 4}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---- Value props ---- */}
      <section className="border-t border-sand bg-sand-light/50">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14 grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            {
              title: "Archival inks",
              body: "200gsm matte paper, fade-resistant for 75+ years indoors.",
            },
            {
              title: "Ships in 3–5 days",
              body: "Rolled in a rigid tube, tracked door to door.",
            },
            {
              title: "Secure checkout",
              body: "UPI, cards & netbanking via Razorpay.",
            },
          ].map((item) => (
            <div key={item.title}>
              <p className="font-display text-lg mb-2">{item.title}</p>
              <p className="text-sm text-taupe leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
