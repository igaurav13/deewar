import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  created: "bg-sand text-ink",
  paid: "bg-success/15 text-success",
  failed: "bg-error/15 text-error",
  shipped: "bg-clay/15 text-clay-dark",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-taupe/15 text-taupe",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  created: "Awaiting payment",
  paid: "Paid",
  failed: "Payment failed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
