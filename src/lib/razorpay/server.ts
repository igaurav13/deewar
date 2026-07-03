import Razorpay from "razorpay";

/**
 * Server-only Razorpay instance. Never import from Client Components —
 * it reads RAZORPAY_KEY_SECRET which must never reach the browser bundle.
 */
export function getRazorpayInstance() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keySecret.startsWith("replace_with")) {
    throw new Error(
      "Razorpay keys are not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local."
    );
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
