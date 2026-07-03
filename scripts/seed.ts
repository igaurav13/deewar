/**
 * Seed sample posters into Supabase for local development / demo purposes.
 *
 * Usage:
 *   1. Run the migration in supabase/migrations/0001_init.sql first
 *      (Supabase Dashboard > SQL Editor > paste & run)
 *   2. Make sure .env.local has SUPABASE_SERVICE_ROLE_KEY set
 *   3. npx tsx scripts/seed.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey || serviceKey.startsWith("replace_with")) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const SAMPLE_POSTERS = [
  {
    title: "Quiet Horizon",
    artist: "Mara Lindqvist",
    description:
      "A muted gradient study of dawn over still water — minimalist, warm, and built to anchor a reading nook.",
    price: 899,
    category: "minimal",
    image:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1000&q=80",
    tags: ["calm", "gradient", "warm"],
    featured: true,
  },
  {
    title: "Fractured Form No. 3",
    artist: "Theo Bristol",
    description:
      "Bold geometric shapes in clay and ink tones, inspired by mid-century collage.",
    price: 1099,
    category: "abstract",
    image:
      "https://images.unsplash.com/photo-1549490349-8643362247b5?w=1000&q=80",
    tags: ["geometric", "bold"],
    featured: true,
  },
  {
    title: "Say Less",
    artist: "Studio Hale",
    description: "Oversized serif typography in soft charcoal on cream.",
    price: 799,
    category: "typography",
    image:
      "https://images.unsplash.com/photo-1486718448742-163732cd1544?w=1000&q=80",
    tags: ["typography", "monochrome"],
    featured: true,
  },
  {
    title: "Terracotta Dunes",
    artist: "Nadia Reyes",
    description: "Sweeping desert curves rendered in warm earth tones.",
    price: 999,
    category: "abstract",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&q=80",
    tags: ["desert", "earthy"],
    featured: false,
  },
  {
    title: "Fern Study I",
    artist: "Wren & Co.",
    description: "Botanical line illustration of fern fronds, museum style.",
    price: 849,
    category: "botanical",
    image:
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1000&q=80",
    tags: ["botanical", "line-art"],
    featured: true,
  },
  {
    title: "Coastal Drift",
    artist: "Iben Sø",
    description: "Soft tonal layers evoking fog over a northern coastline.",
    price: 949,
    category: "minimal",
    image:
      "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=1000&q=80",
    tags: ["coastal", "calm"],
    featured: false,
  },
  {
    title: "Tokyo, Unfolded",
    artist: "Studio Hale",
    description: "A travel-poster homage to Tokyo's skyline at dusk.",
    price: 1199,
    category: "travel",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1000&q=80",
    tags: ["travel", "city"],
    featured: true,
  },
  {
    title: "Monstera Shadow",
    artist: "Wren & Co.",
    description: "High-contrast botanical photography on warm white.",
    price: 879,
    category: "botanical",
    image:
      "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=1000&q=80",
    tags: ["botanical", "shadow"],
    featured: false,
  },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-");
}

async function main() {
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, slug");

  if (catError) {
    console.error("Failed to fetch categories:", catError.message);
    process.exit(1);
  }

  const categoryMap = new Map((categories ?? []).map((c) => [c.slug, c.id]));

  for (const p of SAMPLE_POSTERS) {
    const slug = slugify(p.title) + "-" + Math.random().toString(36).slice(2, 7);
    const { error } = await supabase.from("posters").insert({
      title: p.title,
      slug,
      artist: p.artist,
      description: p.description,
      price_cents: Math.round(p.price * 100),
      category_id: categoryMap.get(p.category) ?? null,
      image_url: p.image,
      sizes: [
        { label: "A3", price_cents: 0 },
        { label: "A2", price_cents: 50000 },
        { label: "A1", price_cents: 90000 },
      ],
      stock: 100,
      is_featured: p.featured,
      is_active: true,
      tags: p.tags,
    });

    if (error) {
      console.error(`Failed to insert "${p.title}":`, error.message);
    } else {
      console.log(`✓ Seeded "${p.title}"`);
    }
  }

  console.log("\nDone seeding posters.");
}

main();
