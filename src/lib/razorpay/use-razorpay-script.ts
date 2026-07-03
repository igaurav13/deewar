"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
};

export function useRazorpayScript() {
  const [loaded, setLoaded] = useState(
    () => typeof window !== "undefined" && !!window.Razorpay
  );

  useEffect(() => {
    if (loaded) return;

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    function handleLoad() {
      setLoaded(true);
    }

    if (existing) {
      existing.addEventListener("load", handleLoad);
      return () => existing.removeEventListener("load", handleLoad);
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.addEventListener("load", handleLoad);
    document.body.appendChild(script);

    return () => {
      script.removeEventListener("load", handleLoad);
    };
  }, [loaded]);

  return loaded;
}
