import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/shop/cart-drawer";

export const metadata: Metadata = {
  title: {
    default: "Deewars.in — Poster Prints for Walls That Say Something",
    template: "%s · Deewars.in",
  },
  description:
    "Museum-grade poster prints across minimal, pop-art, typography and abstract styles. Framed-ready, shipped across India. Secure checkout via Razorpay.",
  icons: {
    icon: "/logo-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  );
}
