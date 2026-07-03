import { z } from "zod";

export const shippingAddressSchema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  line1: z.string().min(4, "Enter your address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

export const cartLineSchema = z.object({
  posterId: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  imageUrl: z.string(),
  sizeLabel: z.string(),
  unitPriceCents: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
});

export const createOrderRequestSchema = z.object({
  lines: z.array(cartLineSchema).min(1, "Your cart is empty"),
  shippingAddress: shippingAddressSchema,
});

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
