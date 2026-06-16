-- Inventory app — Supabase schema
-- Run this in your Supabase project: SQL Editor → New query → paste → Run.

create extension if not exists "pgcrypto";

-- Shipments received
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  retailer text not null default '',
  item_name text not null,
  quantity integer not null default 0 check (quantity >= 0),
  created_at timestamptz not null default now()
);

-- Items listed for sale (eBay, Mercari, etc.)
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  quantity integer not null default 0 check (quantity >= 0),
  platform text not null default '',
  listed_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- Item presets (a small library of items you reuse, with an optional photo)
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo text,                         -- optional base64 data URL (resized client-side)
  created_at timestamptz not null default now()
);

-- Outbound shipments. Each shipment can contain multiple item lines, stored as
-- JSON: [{ "item_name": "Fuzz Balls", "quantity": 2 }, ...]. These decrement inventory.
create table if not exists public.outbound_shipments (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  ship_to text not null default '',   -- "City, ST"
  initials text not null default '',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists shipments_item_idx on public.shipments (lower(item_name));
create index if not exists listings_item_idx on public.listings (lower(item_name));
create index if not exists shipments_date_idx on public.shipments (date);
create index if not exists listings_date_idx on public.listings (listed_at);
create index if not exists items_name_idx on public.items (lower(name));
create index if not exists outbound_date_idx on public.outbound_shipments (date);

-- Row Level Security.
-- This app uses the anon key from a single trusted desktop. The simplest setup
-- for personal use is to allow the anon role full access. If you later add
-- Supabase Auth, replace these policies with user-scoped ones.
alter table public.shipments enable row level security;
alter table public.listings enable row level security;
alter table public.items enable row level security;
alter table public.outbound_shipments enable row level security;

drop policy if exists "anon all shipments" on public.shipments;
create policy "anon all shipments" on public.shipments
  for all to anon using (true) with check (true);

drop policy if exists "anon all listings" on public.listings;
create policy "anon all listings" on public.listings
  for all to anon using (true) with check (true);

drop policy if exists "anon all items" on public.items;
create policy "anon all items" on public.items
  for all to anon using (true) with check (true);

drop policy if exists "anon all outbound" on public.outbound_shipments;
create policy "anon all outbound" on public.outbound_shipments
  for all to anon using (true) with check (true);
