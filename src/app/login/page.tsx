import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <h1 className="font-display text-3xl text-center mb-2">Welcome back</h1>
      <p className="text-taupe text-center mb-10">
        Sign in to track orders and save your favorites.
      </p>
      <AuthForm mode="login" />
    </div>
  );
}
