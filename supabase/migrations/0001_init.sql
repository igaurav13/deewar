-- ============================================================================
-- POSTER STORE — INITIAL SCHEMA
-- Run this in Supabase SQL Editor (or via `supabase db push`)
-- ============================================================================

-- Extension for UUID generation
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- PROFILES  (extends Supabase auth.users with app-level fields)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are editable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- CATEGORIES
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Categories are viewable by everyone"
  on public.categories for select
  using (true);

-- ----------------------------------------------------------------------------
-- POSTERS  (the product catalog)
-- ----------------------------------------------------------------------------
create table if not exists public.posters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  artist text,
  price_cents integer not null check (price_cents >= 0), -- price in paise (INR)
  compare_at_price_cents integer check (compare_at_price_cents >= 0),
  category_id uuid references public.categories(id) on delete set null,
  image_url text not null,
  additional_images text[] default '{}',
  sizes jsonb not null default '[{"label":"A3","price_cents":0},{"label":"A2","price_cents":50000},{"label":"A1","price_cents":90000}]'::jsonb,
  stock integer not null default 100 check (stock >= 0),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posters_category_idx on public.posters(category_id);
create index if not exists posters_active_idx on public.posters(is_active);
create index if not exists posters_search_idx on public.posters
  using gin (to_tsvector('english', title || ' ' || coalesce(artist, '') || ' ' || coalesce(description, '')));

alter table public.posters enable row level security;

create policy "Active posters are viewable by everyone"
  on public.posters for select
  using (is_active = true);

create policy "Admins can view all posters"
  on public.posters for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can insert posters"
  on public.posters for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can update posters"
  on public.posters for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can delete posters"
  on public.posters for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posters_set_updated_at on public.posters;
create trigger posters_set_updated_at
  before update on public.posters
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- WISHLIST
-- ----------------------------------------------------------------------------
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  poster_id uuid not null references public.posters(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, poster_id)
);

alter table public.wishlist_items enable row level security;

create policy "Users manage their own wishlist"
  on public.wishlist_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- ADDRESSES
-- ----------------------------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.addresses enable row level security;

create policy "Users manage their own addresses"
  on public.addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- ORDERS  +  ORDER ITEMS
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'created'
    check (status in ('created', 'paid', 'failed', 'shipped', 'delivered', 'cancelled')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0,
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'INR',
  shipping_address jsonb not null,
  razorpay_order_id text unique,
  razorpay_payment_id text,
  razorpay_signature text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_razorpay_order_idx on public.orders(razorpay_order_id);

alter table public.orders enable row level security;

create policy "Users view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users create their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Admins view all orders"
  on public.orders for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins update orders"
  on public.orders for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  poster_id uuid references public.posters(id) on delete set null,
  title text not null,        -- snapshot at time of purchase
  size_label text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  image_url text
);

create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.order_items enable row level security;

create policy "Users view items of their own orders"
  on public.order_items for select
  using (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id and orders.user_id = auth.uid()
  ));

create policy "Users insert items for their own orders"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id and orders.user_id = auth.uid()
  ));

create policy "Admins view all order items"
  on public.order_items for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- ----------------------------------------------------------------------------
-- STORAGE BUCKET for poster images
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

create policy "Poster images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'posters');

create policy "Admins can upload poster images"
  on storage.objects for insert
  with check (
    bucket_id = 'posters'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update poster images"
  on storage.objects for update
  using (
    bucket_id = 'posters'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete poster images"
  on storage.objects for delete
  using (
    bucket_id = 'posters'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ----------------------------------------------------------------------------
-- SEED: categories + sample posters
-- ----------------------------------------------------------------------------
insert into public.categories (name, slug) values
  ('Minimal', 'minimal'),
  ('Abstract', 'abstract'),
  ('Typography', 'typography'),
  ('Nature', 'nature'),
  ('Travel', 'travel'),
  ('Botanical', 'botanical')
on conflict (slug) do nothing;
