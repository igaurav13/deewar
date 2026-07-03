"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cart";
import { formatINR } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useRazorpayScript,
  type RazorpayOptions,
} from "@/lib/razorpay/use-razorpay-script";
import { shippingAddressSchema } from "@/lib/validation/checkout";
import type { ShippingAddress } from "@/types";

const SHIPPING_THRESHOLD_CENTS = 200000;
const FLAT_SHIPPING_CENTS = 9900;

export function CheckoutClient({
  userEmail,
  userName,
}: {
  userEmail?: string;
  userName?: string;
}) {
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotalCents());
  const razorpayLoaded = useRazorpayScript();
  const router = useRouter();

  const [address, setAddress] = useState<ShippingAddress>({
    full_name: userName ?? "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const shipping = subtotal >= SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  const total = subtotal + shipping;

  function updateField(field: keyof ShippingAddress, value: string) {
    setAddress((a) => ({ ...a, [field]: value }));
  }

  async function handlePayment() {
    setSubmitError(null);

    const parsed = shippingAddressSchema.safeParse(address);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (!razorpayLoaded) {
      setSubmitError("Payment gateway is still loading — try again in a moment.");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          shippingAddress: parsed.data,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Could not start checkout");
        setIsProcessing(false);
        return;
      }

      const options: RazorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Frame & Form",
        description: "Poster order",
        order_id: data.razorpayOrderId,
        prefill: {
          name: parsed.data.full_name,
          email: userEmail,
          contact: parsed.data.phone,
        },
        theme: { color: "#c97a56" },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
        handler: async (response) => {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();

          if (verifyRes.ok) {
            clearCart();
            router.push(`/order/${verifyData.orderId}/confirmed`);
          } else {
            setSubmitError(
              "Payment was made but verification failed. Contact support with your payment ID."
            );
            setIsProcessing(false);
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-taupe">Your cart is empty.</p>
        <Link href="/shop" className="text-clay hover:underline text-sm mt-2 inline-block">
          Browse posters
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[1fr_380px] gap-12">
      <div>
        <h2 className="font-display text-2xl mb-6">Shipping address</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            id="full_name"
            label="Full name"
            value={address.full_name}
            onChange={(e) => updateField("full_name", e.target.value)}
            error={errors.full_name}
            className="sm:col-span-2"
          />
          <Input
            id="phone"
            label="Phone number"
            value={address.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            error={errors.phone}
            placeholder="9876543210"
          />
          <Input
            id="pincode"
            label="Pincode"
            value={address.pincode}
            onChange={(e) => updateField("pincode", e.target.value)}
            error={errors.pincode}
          />
          <Input
            id="line1"
            label="Address line 1"
            value={address.line1}
            onChange={(e) => updateField("line1", e.target.value)}
            error={errors.line1}
            className="sm:col-span-2"
          />
          <Input
            id="line2"
            label="Address line 2 (optional)"
            value={address.line2}
            onChange={(e) => updateField("line2", e.target.value)}
            className="sm:col-span-2"
          />
          <Input
            id="city"
            label="City"
            value={address.city}
            onChange={(e) => updateField("city", e.target.value)}
            error={errors.city}
          />
          <Input
            id="state"
            label="State"
            value={address.state}
            onChange={(e) => updateField("state", e.target.value)}
            error={errors.state}
          />
        </div>

        {submitError && (
          <p className="text-sm text-error mt-4">{submitError}</p>
        )}

        <Button
          size="lg"
          className="w-full mt-8"
          onClick={handlePayment}
          isLoading={isProcessing}
        >
          Pay {formatINR(total)} with Razorpay
        </Button>
        <p className="text-xs text-taupe mt-3 text-center">
          Supports UPI, cards, netbanking & wallets.
        </p>
      </div>

      <div className="bg-sand-light/60 rounded-sm p-6 h-fit">
        <h2 className="font-display text-xl mb-5">Order summary</h2>
        <div className="space-y-4 mb-6">
          {lines.map((line) => (
            <div key={`${line.posterId}-${line.sizeLabel}`} className="flex gap-3">
              <div className="relative size-16 shrink-0 rounded-sm overflow-hidden bg-canvas">
                <Image
                  src={line.imageUrl}
                  alt={line.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{line.title}</p>
                <p className="text-xs text-taupe">
                  {line.sizeLabel} × {line.quantity}
                </p>
              </div>
              <p className="text-sm">
                {formatINR(line.unitPriceCents * line.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-sand pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-taupe">Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-taupe">Shipping</span>
            <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
          </div>
          <div className="flex justify-between font-medium text-base pt-2 border-t border-sand">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
