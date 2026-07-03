import Link from "next/link";
import { Suspense } from "react";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { SearchBar } from "@/components/shop/search-bar";
import { CartButton } from "@/components/shop/cart-button";
import { AccountMenu } from "@/components/shop/account-menu";
import { Logo } from "@/components/ui/logo";

const NAV_LINKS = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?category=minimal", label: "Minimal" },
  { href: "/shop?category=abstract", label: "Abstract" },
  { href: "/shop?category=typography", label: "Typography" },
];

export async function Navbar() {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;

  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />

          <nav className="hidden md:flex items-center gap-7 text-sm text-ink/80">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-clay transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Suspense
              fallback={<div className="size-10" aria-hidden="true" />}
            >
              <SearchBar />
            </Suspense>
            <AccountMenu isLoggedIn={!!user} isAdmin={!!profile?.is_admin} />
            <CartButton />
          </div>
        </div>

        <nav className="flex md:hidden items-center gap-5 overflow-x-auto pb-3 text-sm text-ink/80 -mx-1 px-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap hover:text-clay transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
