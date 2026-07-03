export type PosterSize = {
  label: string;
  price_cents: number; // additive on top of base price_cents
};

export type Poster = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  artist: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  category_id: string | null;
  image_url: string;
  additional_images: string[];
  sizes: PosterSize[];
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  category?: Category | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Address = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
};

export type OrderStatus =
  | "created"
  | "paid"
  | "failed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  id: string;
  order_id: string;
  poster_id: string | null;
  title: string;
  size_label: string;
  unit_price_cents: number;
  quantity: number;
  image_url: string | null;
};

export type Order = {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  shipping_address: ShippingAddress;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type ShippingAddress = {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

export type WishlistItem = {
  id: string;
  user_id: string;
  poster_id: string;
  created_at: string;
  poster?: Poster;
};

// ---- Cart (client-side only, persisted in zustand + localStorage) ----
export type CartLine = {
  posterId: string;
  title: string;
  slug: string;
  imageUrl: string;
  sizeLabel: string;
  unitPriceCents: number; // base + size addon, snapshotted at add-time
  quantity: number;
};
