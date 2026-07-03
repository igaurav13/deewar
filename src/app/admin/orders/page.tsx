import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import type { Order, OrderItem, ShippingAddress } from "@/types";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as (Order & { order_items: OrderItem[] })[];

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Orders ({orders.length})</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const address = order.shipping_address as ShippingAddress;
          return (
            <div key={order.id} className="border border-sand rounded-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-mono text-xs text-taupe">{order.id}</p>
                  <p className="text-sm mt-1">
                    {address.full_name} · {address.city}, {address.state}
                  </p>
                  <p className="text-xs text-taupe mt-0.5">
                    {new Date(order.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatINR(order.total_cents)}</span>
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </div>
              </div>
              <div className="text-sm text-taupe space-y-1">
                {order.order_items.map((item) => (
                  <p key={item.id}>
                    {item.title} ({item.size_label}) × {item.quantity}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className="border border-dashed border-sand rounded-sm py-16 text-center text-taupe">
          No orders yet.
        </div>
      )}
    </div>
  );
}
