"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    router.push(`/shop?${params.toString()}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Search posters"
        className={cn(
          "flex items-center justify-center size-10 rounded-full hover:bg-sand-light transition-colors cursor-pointer",
          className
        )}
      >
        <Search className="size-5" strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-2 border-b border-ink/30 pb-1 animate-fade-in",
        className
      )}
    >
      <Search className="size-4 text-taupe" strokeWidth={1.5} />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search posters, artists, moods…"
        className="w-44 sm:w-64 bg-transparent text-sm placeholder:text-taupe/70 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close search"
        className="cursor-pointer"
      >
        <X className="size-4 text-taupe" />
      </button>
    </form>
  );
}
