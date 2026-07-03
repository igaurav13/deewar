import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Razorpay webhook — configure this URL in Razorpay Dashboard >
 * Settings > Webhooks as: https://yourdomain.com/api/webhooks/razorpay
 * Subscribe to: payment.captured, payment.failed
 *
 * This is the SOURCE OF TRUTH for order status. Unlike the /verify route
 * (which only fires if the user stays on the page), Razorpay calls this
 * server-to-server regardless of what happens in the browser.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.startsWith("replace_with")) {
    console.error("RAZORPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex")
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const admin = createAdminClient();

  try {
    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        await admin
          .from("orders")
          .update({
            status: "paid",
            razorpay_payment_id: payment.id,
          })
          .eq("razorpay_order_id", payment.order_id);
        break;
      }
      case "payment.failed": {
        const payment = event.payload.payment.entity;
        await admin
          .from("orders")
          .update({ status: "failed" })
          .eq("razorpay_order_id", payment.order_id);
        break;
      }
      default:
        // Ignore events we don't act on
        break;
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
