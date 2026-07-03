import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth";
import { CheckoutClient } from "@/components/shop/checkout-client";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/checkout");
  }
  const profile = await getCurrentProfile();

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-14">
      <h1 className="font-display text-3xl sm:text-4xl mb-10">Checkout</h1>
      <CheckoutClient
        userEmail={user.email ?? undefined}
        userName={profile?.full_name ?? undefined}
      />
    </div>
  );
}
