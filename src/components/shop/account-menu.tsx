"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { User, Heart, Package, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AccountMenu({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="flex items-center justify-center size-10 rounded-full hover:bg-sand-light transition-colors"
        aria-label="Sign in"
      >
        <User className="size-5" strokeWidth={1.5} />
      </Link>
    );
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="flex items-center justify-center size-10 rounded-full hover:bg-sand-light transition-colors cursor-pointer"
      >
        <User className="size-5" strokeWidth={1.5} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-52 rounded-sm border border-sand bg-canvas shadow-lg animate-fade-in z-50 overflow-hidden"
          role="menu"
        >
          <Link
            href="/account/orders"
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-sand-light transition-colors"
            onClick={() => setOpen(false)}
          >
            <Package className="size-4" strokeWidth={1.5} />
            Order history
          </Link>
          <Link
            href="/account/wishlist"
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-sand-light transition-colors"
            onClick={() => setOpen(false)}
          >
            <Heart className="size-4" strokeWidth={1.5} />
            Wishlist
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-sand-light transition-colors"
              onClick={() => setOpen(false)}
            >
              <ShieldCheck className="size-4" strokeWidth={1.5} />
              Admin panel
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-sand-light transition-colors w-full text-left border-t border-sand cursor-pointer"
          >
            <LogOut className="size-4" strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
