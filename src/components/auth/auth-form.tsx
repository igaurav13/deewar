"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      if (!fullName.trim() || !email.trim() || password.length < 6) {
        setError("Full name, email and password are required. Password must be at least 6 characters.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }

      if (data?.session) {
        router.push("/");
        router.refresh();
        return;
      }

      setMessage("Check your inbox to confirm your email.");
      return;
    }

    if (!email.trim() || password.length < 6) {
      setError("Email and password are required. Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mode === "signup" && (
        <Input
          id="full_name"
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
        />
      )}
      <Input
        id="email"
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="pr-14"
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-taupe hover:text-ink"
          aria-label="Toggle visibility"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-success">
          {message}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" isLoading={loading}>
        {mode === "signup" ? "Create account" : "Sign in"}
      </Button>

      <p className="text-sm text-taupe text-center">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-clay hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="text-clay hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
