import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import type { Order, OrderItem } from "@/types";

export default async function OrderHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/orders");

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const typedOrders = (orders ?? []) as (Order & { order_items: OrderItem[] })[];

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-10 sm:py-14">
      <h1 className="font-display text-3xl mb-10">Order history</h1>

      {typedOrders.length === 0 ? (
        <div className="border border-dashed border-sand rounded-sm py-20 text-center text-taupe">
          <p>You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="text-clay hover:underline text-sm mt-2 inline-block">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {typedOrders.map((order) => (
            <div key={order.id} className="border border-sand rounded-sm p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-sand">
                <div>
                  <p className="text-xs text-taupe">
                    Placed {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs font-mono text-taupe mt-0.5">
                    #{order.id.slice(0, 8)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    {item.image_url && (
                      <div className="relative size-14 shrink-0 rounded-sm overflow-hidden bg-sand-light">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-taupe">
                        {item.size_label} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm">
                      {formatINR(item.unit_price_cents * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-sand">
                <span className="text-sm text-taupe">Total</span>
                <span className="font-medium">{formatINR(order.total_cents)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
