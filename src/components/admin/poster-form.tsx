"use client";

import { useActionState } from "react";
import type { Category, Poster } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PosterImageUpload } from "@/components/admin/poster-image-upload";
import type { PosterFormState } from "@/app/actions/admin";

export function PosterForm({
  categories,
  poster,
  action,
}: {
  categories: Category[];
  poster?: Poster;
  action: (state: PosterFormState, formData: FormData) => Promise<PosterFormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  const defaultSizes = poster?.sizes?.length
    ? poster.sizes
    : [
        { label: "A3", price_cents: 0 },
        { label: "A2", price_cents: 500 },
        { label: "A1", price_cents: 900 },
      ];

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <Input
        id="title"
        name="title"
        label="Title"
        defaultValue={poster?.title}
        required
      />

      <div>
        <label htmlFor="description" className="text-sm font-medium block mb-1.5">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={poster?.description ?? ""}
          rows={3}
          className="w-full rounded-sm border border-sand bg-canvas px-4 py-2.5 focus:border-clay transition-colors"
        />
      </div>

      <Input id="artist" name="artist" label="Artist (optional)" defaultValue={poster?.artist ?? ""} />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          label="Base price (₹)"
          defaultValue={poster ? poster.price_cents / 100 : ""}
          required
        />
        <Input
          id="compare_at_price"
          name="compare_at_price"
          type="number"
          step="0.01"
          label="Compare-at price (₹, optional)"
          defaultValue={poster?.compare_at_price_cents ? poster.compare_at_price_cents / 100 : ""}
        />
      </div>

      <div>
        <label htmlFor="category_id" className="text-sm font-medium block mb-1.5">
          Category
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={poster?.category_id ?? ""}
          className="w-full rounded-sm border border-sand bg-canvas px-4 py-2.5 focus:border-clay transition-colors"
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <PosterImageUpload name="image_url" initialUrl={poster?.image_url} />

      <Input id="stock" name="stock" type="number" label="Stock" defaultValue={poster?.stock ?? 100} required />

      <div>
        <label htmlFor="sizes" className="text-sm font-medium block mb-1.5">
          Sizes (JSON — label + price add-on in paise)
        </label>
        <textarea
          id="sizes"
          name="sizes"
          defaultValue={JSON.stringify(defaultSizes)}
          rows={3}
          className="w-full rounded-sm border border-sand bg-canvas px-4 py-2.5 font-mono text-xs focus:border-clay transition-colors"
        />
      </div>

      <Input
        id="tags"
        name="tags"
        label="Tags (comma separated)"
        defaultValue={poster?.tags?.join(", ") ?? ""}
      />

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_featured" defaultChecked={poster?.is_featured} />
          Featured on homepage
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={poster?.is_active ?? true} />
          Active (visible in shop)
        </label>
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}

      <Button type="submit" size="lg" isLoading={isPending}>
        {poster ? "Save changes" : "Create poster"}
      </Button>
    </form>
  );
}
