import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-sand mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div className="max-w-xs">
            <Logo className="mb-3" />
            <p className="text-sm text-taupe leading-relaxed">
              Poster prints for walls that mean something. Curated art,
              pop culture &amp; typography — designed in small batches,
              shipped across India.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Shop</p>
            <ul className="space-y-2 text-sm text-taupe">
              <li>
                <Link href="/shop" className="hover:text-clay transition-colors">
                  All posters
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=minimal"
                  className="hover:text-clay transition-colors"
                >
                  Minimal
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=botanical"
                  className="hover:text-clay transition-colors"
                >
                  Botanical
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Account</p>
            <ul className="space-y-2 text-sm text-taupe">
              <li>
                <Link
                  href="/account/orders"
                  className="hover:text-clay transition-colors"
                >
                  Order history
                </Link>
              </li>
              <li>
                <Link
                  href="/account/wishlist"
                  className="hover:text-clay transition-colors"
                >
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Good to know</p>
            <ul className="space-y-2 text-sm text-taupe">
              <li>Free shipping over ₹2,000</li>
              <li>Prints ship in 3–5 days</li>
              <li>Secure checkout via Razorpay</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-sand flex flex-col sm:flex-row justify-between gap-2 text-xs text-taupe">
          <p>© {new Date().getFullYear()} Deewars.in. All rights reserved.</p>
          <p>Made for walls that say something.</p>
        </div>
      </div>
    </footer>
  );
}
