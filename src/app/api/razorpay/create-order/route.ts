import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayInstance } from "@/lib/razorpay/server";
import { createOrderRequestSchema } from "@/lib/validation/checkout";
import { priceCart } from "@/lib/data/pricing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createOrderRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return NextResponse.json({ error: "Please sign in to checkout" }, { status: 401 });
    }

    // ⚠️ Authoritative pricing — recomputed server-side from the DB.
    // We never trust unitPriceCents sent by the client.
    const pricing = await priceCart(
      parsed.data.lines.map((l) => ({
        posterId: l.posterId,
        sizeLabel: l.sizeLabel,
        quantity: l.quantity,
      }))
    );

    if (pricing.totalCents <= 0) {
      return NextResponse.json({ error: "Cart total must be greater than zero" }, { status: 400 });
    }

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: pricing.totalCents, // Razorpay expects amount in the smallest unit (paise)
      currency: "INR",
      notes: { user_id: user.id },
    });

    const admin = createAdminClient();
    const { data: order, error: insertError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        status: "created",
        subtotal_cents: pricing.subtotalCents,
        shipping_cents: pricing.shippingCents,
        total_cents: pricing.totalCents,
        currency: "INR",
        shipping_address: parsed.data.shippingAddress,
        razorpay_order_id: razorpayOrder.id,
      })
      .select()
      .single();

    if (insertError || !order) {
      console.error("Order insert failed:", insertError?.message);
      return NextResponse.json({ error: "Could not create order" }, { status: 500 });
    }

    const orderItemsPayload = pricing.lines.map((line) => ({
      order_id: order.id,
      poster_id: line.posterId,
      title: line.title,
      size_label: line.sizeLabel,
      unit_price_cents: line.unitPriceCents,
      quantity: line.quantity,
      image_url: line.imageUrl,
    }));

    const { error: itemsError } = await admin
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsError) {
      console.error("Order items insert failed:", itemsError.message);
      return NextResponse.json({ error: "Could not create order items" }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: pricing.totalCents,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("create-order error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
