"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/app/actions/admin";
import type { OrderStatus } from "@/types";

const STATUSES: OrderStatus[] = [
  "created",
  "paid",
  "failed",
  "shipped",
  "delivered",
  "cancelled",
];

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => updateOrderStatus(orderId, e.target.value))
      }
      className="text-sm border border-sand rounded-sm px-2 py-1.5 bg-canvas focus:border-clay transition-colors"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
