-- Pressline · Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) after creating your project.

-- Profiles table, one row per auth user
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  plan text not null default 'cub_press',
  credits_remaining int not null default 5,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Generation history: every draft run through a tool
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_name text not null,
  prompt text not null,
  output text not null,
  created_at timestamptz not null default now()
);

alter table public.generations enable row level security;

create policy "Users can view their own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own generations"
  on public.generations for delete
  using (auth.uid() = user_id);

-- Connected publishing sites (WordPress / Blogger)
create table if not exists public.connected_sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('wordpress', 'blogger', 'amazon')),
  site_url text,
  access_token text,
  created_at timestamptz not null default now()
);

alter table public.connected_sites enable row level security;

create policy "Users can manage their own connected sites"
  on public.connected_sites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists generations_user_id_idx on public.generations (user_id, created_at desc);
