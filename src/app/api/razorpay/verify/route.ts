import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Called from the client immediately after Razorpay's checkout modal
 * succeeds. This is a CONVENIENCE update for fast UI feedback — the
 * webhook handler (/api/webhooks/razorpay) is the source of truth and
 * will also mark the order paid even if the user closes the tab here.
 *
 * Security: we verify the HMAC-SHA256 signature using our key secret.
 * Never trust payment success based on the client alone.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(razorpay_signature, "hex")
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: order, error } = await admin
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id,
        razorpay_signature,
      })
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", userData.user.id)
      .select()
      .single();

    if (error || !order) {
      console.error("verify: order update failed", error?.message);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error("verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
