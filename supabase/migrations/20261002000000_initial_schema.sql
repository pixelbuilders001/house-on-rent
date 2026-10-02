-- RoomSaathi core data model. Run with Supabase CLI or paste into the SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text unique,
  role text not null default 'tenant' check (role in ('tenant','owner','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.destinations (
  id text primary key,
  name text not null,
  type text not null,
  area text not null,
  city text not null default 'Samastipur',
  created_at timestamptz not null default now()
);

create table if not exists public.amenities (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  id text primary key,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  type text not null check (type in ('PG','Hostel','Room','Flat')),
  city text not null default 'Samastipur',
  area text not null,
  distance_km numeric not null default 0,
  commute_minutes integer not null default 0,
  rating numeric not null default 0,
  review_count integer not null default 0,
  verified boolean not null default false,
  verification_level text not null default 'owner_verified',
  rent integer not null check (rent >= 0),
  deposit integer not null default 0 check (deposit >= 0),
  brokerage integer not null default 0 check (brokerage >= 0),
  electricity integer not null default 0,
  wifi_cost integer not null default 0,
  maintenance integer not null default 0,
  food_cost integer not null default 0,
  food_available boolean not null default false,
  food_included boolean not null default false,
  wifi boolean not null default false,
  electricity_included boolean not null default false,
  available_beds integer not null default 0,
  total_beds integer not null default 0,
  accommodation text not null,
  amenities text[] not null default '{}',
  image text not null default '',
  color text not null default '#e4ebe4',
  description text not null default '',
  owner_name text not null default '',
  rules text[] not null default '{}',
  updated_label text not null default 'Recently added',
  destination_id text references public.destinations(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id text primary key,
  property_id text not null references public.properties(id) on delete cascade,
  room_number text not null,
  accommodation text not null,
  rent integer not null default 0,
  created_at timestamptz not null default now(),
  unique(property_id, room_number)
);

create table if not exists public.beds (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  bed_label text not null,
  status text not null default 'available' check (status in ('available','occupied','reserved')),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  property_id text references public.properties(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.properties(id) on delete cascade,
  renter_id uuid references public.profiles(id) on delete set null,
  renter_name text not null,
  budget integer not null default 0,
  looking_for text not null,
  destination text not null default '',
  status text not null default 'new' check (status in ('new','contacted','visit_requested','closed')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.amenities enable row level security;
alter table public.properties enable row level security;
alter table public.rooms enable row level security;
alter table public.beds enable row level security;
alter table public.reviews enable row level security;
alter table public.leads enable row level security;

drop policy if exists "Public can read destinations" on public.destinations;
create policy "Public can read destinations" on public.destinations for select using (true);
drop policy if exists "Public can read amenities" on public.amenities;
create policy "Public can read amenities" on public.amenities for select using (true);
drop policy if exists "Anyone can read active properties" on public.properties;
create policy "Anyone can read active properties" on public.properties for select using (is_active = true);
drop policy if exists "Owners can insert their properties" on public.properties;
create policy "Owners can insert their properties" on public.properties for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "Owners can update their properties" on public.properties;
create policy "Owners can update their properties" on public.properties for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "Public can read rooms of active properties" on public.rooms;
create policy "Public can read rooms of active properties" on public.rooms for select using (exists (select 1 from public.properties p where p.id = property_id and p.is_active));
drop policy if exists "Public can read beds of active listings" on public.beds;
create policy "Public can read beds of active listings" on public.beds for select using (exists (select 1 from public.rooms r join public.properties p on p.id = r.property_id where r.id = room_id and p.is_active));
drop policy if exists "Public can read published reviews" on public.reviews;
create policy "Public can read published reviews" on public.reviews for select using (is_published = true);
drop policy if exists "Signed-in users can write their reviews" on public.reviews;
create policy "Signed-in users can write their reviews" on public.reviews for insert to authenticated with check (reviewer_id = auth.uid() and is_published = false);
drop policy if exists "Renter can create a lead" on public.leads;
create policy "Renter can create a lead" on public.leads for insert to authenticated with check (renter_id = auth.uid());
drop policy if exists "Renters can view their leads" on public.leads;
create policy "Renters can view their leads" on public.leads for select to authenticated using (renter_id = auth.uid());
drop policy if exists "Owners can view leads for their properties" on public.leads;
create policy "Owners can view leads for their properties" on public.leads for select to authenticated using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()));
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create index if not exists properties_search_idx on public.properties (is_active, city, rent, commute_minutes);
create index if not exists properties_owner_idx on public.properties (owner_id);
create index if not exists rooms_property_idx on public.rooms (property_id);
create index if not exists leads_property_status_idx on public.leads (property_id, status);
