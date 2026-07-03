import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <h1 className="font-display text-3xl text-center mb-2">
        Create an account
      </h1>
      <p className="text-taupe text-center mb-10">
        Save addresses, track orders, and build a wishlist.
      </p>
      <AuthForm mode="signup" />
    </div>
  );
}
