"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PosterGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-[3/4] rounded-sm overflow-hidden bg-canvas border border-sand/60">
        <Image
          src={images[active]}
          alt={title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3 mt-4">
          {images.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setActive(i)}
              className={cn(
                "relative size-16 rounded-sm overflow-hidden border-2 transition-colors cursor-pointer",
                active === i ? "border-clay" : "border-transparent"
              )}
              aria-label={`View image ${i + 1} of ${title}`}
            >
              <Image src={img} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
