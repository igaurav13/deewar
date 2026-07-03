"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function slugifyFilename(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot > -1 ? name.slice(dot + 1).toLowerCase() : "jpg";
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${rand}.${ext}`;
}

export function PosterImageUpload({
  name = "image_url",
  initialUrl,
}: {
  name?: string;
  initialUrl?: string;
}) {
  const [imageUrl, setImageUrl] = useState(initialUrl ?? "");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, WEBP, or AVIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large — max 10MB.");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const path = `uploads/${slugifyFilename(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from("posters")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        // Most common cause: signed in but not an admin (RLS blocks the insert).
        setError(uploadError.message || "Upload failed. Are you signed in as an admin?");
        return;
      }

      const { data } = supabase.storage.from("posters").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block mb-1.5">Poster image</label>

      {/* This is the field the server action actually reads via formData.get("image_url") */}
      <input type="hidden" name={name} value={imageUrl} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
          isDragging ? "border-clay bg-clay/5" : "border-sand bg-canvas hover:border-clay/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />

        {imageUrl ? (
          <div className="relative w-full max-w-[220px] aspect-[3/4]">
            <Image
              src={imageUrl}
              alt="Poster preview"
              fill
              className="object-cover rounded-sm"
              unoptimized
            />
          </div>
        ) : (
          <div className="text-taupe">
            <p className="text-sm font-medium">Drag & drop an image here, or click to browse</p>
            <p className="text-xs mt-1">JPG, PNG, WEBP, or AVIF · up to 10MB</p>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-canvas/80 rounded-sm">
            <span className="text-sm text-clay animate-pulse">Uploading…</span>
          </div>
        )}
      </div>

      {imageUrl && !isUploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setImageUrl("");
          }}
          className="text-xs text-taupe hover:text-error underline"
        >
          Remove image
        </button>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <details className="text-xs text-taupe">
        <summary className="cursor-pointer select-none">Paste a URL instead</summary>
        <input
          type="url"
          placeholder="https://…"
          defaultValue={imageUrl}
          onBlur={(e) => {
            if (e.target.value) setImageUrl(e.target.value);
          }}
          className="mt-2 w-full rounded-sm border border-sand bg-canvas px-4 py-2 text-ink placeholder:text-taupe/70 focus:border-clay transition-colors"
        />
      </details>
    </div>
  );
}
