import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Order, OrderItem } from "@/types";

export default async function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/order/${id}/confirmed`);

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!order) notFound();

  const typedOrder = order as Order & { order_items: OrderItem[] };

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:py-24 text-center">
      <CheckCircle2 className="size-14 text-success mx-auto mb-6" strokeWidth={1.25} />
      <h1 className="font-display text-3xl sm:text-4xl">
        {typedOrder.status === "paid" ? "Order confirmed" : "Order received"}
      </h1>
      <p className="text-taupe mt-3">
        {typedOrder.status === "paid"
          ? "Thank you — your prints are being prepared for shipping."
          : "We're confirming your payment. This usually takes a moment."}
      </p>

      <div className="mt-10 text-left bg-sand-light/60 rounded-sm p-6">
        <div className="flex justify-between text-sm mb-4">
          <span className="text-taupe">Order ID</span>
          <span className="font-mono text-xs">{typedOrder.id}</span>
        </div>
        <div className="space-y-3 mb-4">
          {typedOrder.order_items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.title} ({item.size_label}) × {item.quantity}
              </span>
              <span>{formatINR(item.unit_price_cents * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-sand pt-3 flex justify-between font-medium">
          <span>Total paid</span>
          <span>{formatINR(typedOrder.total_cents)}</span>
        </div>
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <Button variant="outline">
          <Link href="/account/orders">View order history</Link>
        </Button>
        <Button>
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
