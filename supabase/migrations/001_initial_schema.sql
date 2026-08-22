-- NovaPilot · Supabase Schema Migration 001
-- Run in Supabase SQL editor or via supabase db push

-- ─── Extensions ─────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Profiles ────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  plan text not null default 'free',
  role text not null default 'user' check (role in ('user','admin')),
  credits_remaining int not null default 5,
  default_workspace_id uuid,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Workspaces ──────────────────────────────────────────────────
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references auth.users(id) on delete restrict,
  logo_url text,
  plan text not null default 'free',
  status text not null default 'active' check (status in ('active','suspended','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Workspace Members ───────────────────────────────────────────
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','editor','member','viewer')),
  created_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

-- ─── Workspace Invitations ───────────────────────────────────────
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  token text not null unique default encode(gen_random_bytes(32),'hex'),
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─── Plans ───────────────────────────────────────────────────────
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price_monthly numeric(10,2) not null default 0,
  price_yearly numeric(10,2) not null default 0,
  credits_limit int not null default 100,
  max_projects int not null default 3,
  max_team_members int not null default 1,
  stripe_price_monthly text,
  stripe_price_yearly text,
  features jsonb not null default '[]',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── Subscriptions ───────────────────────────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  plan_id uuid references public.plans(id),
  status text not null default 'active' check (status in ('active','trialing','past_due','cancelled','incomplete')),
  stripe_customer_id text,
  stripe_subscription_id text,
  credits_limit int not null default 100,
  credits_used int not null default 0,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id)
);

-- ─── Credit Balances ─────────────────────────────────────────────
create table if not exists public.credit_balances (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  balance int not null default 0,
  updated_at timestamptz not null default now()
);

-- ─── Credit Transactions ─────────────────────────────────────────
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('purchase','subscription','generation','refund','bonus','adjustment')),
  amount int not null,
  balance_after int not null,
  reference_type text,
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);

-- ─── Projects ────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  name text not null,
  description text,
  domain text,
  default_tone text,
  default_language text not null default 'en',
  brand_voice_id uuid,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Brand Voices ────────────────────────────────────────────────
create table if not exists public.brand_voices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  name text not null,
  tone text,
  audience text,
  do_rules text,
  dont_rules text,
  sample_text text,
  preferred_phrases text,
  forbidden_phrases text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Templates ───────────────────────────────────────────────────
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text not null,
  description text,
  category text not null default 'general',
  content text not null default '',
  variables jsonb not null default '{}',
  is_public boolean not null default false,
  is_favorite boolean not null default false,
  use_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Contents ────────────────────────────────────────────────────
create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  project_id uuid references public.projects(id) on delete set null,
  title text not null default 'Untitled',
  type text not null default 'article',
  status text not null default 'draft' check (status in ('draft','generating','generated','editing','approved','scheduled','publishing','published','failed','archived')),
  body text,
  word_count int not null default 0,
  seo_score int,
  readability_score int,
  meta_title text,
  meta_description text,
  slug text,
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Content Versions ────────────────────────────────────────────
create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  body text not null,
  word_count int not null default 0,
  version_number int not null default 1,
  created_at timestamptz not null default now()
);

-- ─── Generations ─────────────────────────────────────────────────
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  content_id uuid references public.contents(id) on delete set null,
  type text not null,
  provider text not null default 'openai',
  model text not null default 'gpt-4o-mini',
  prompt_version text not null default 'v1',
  input_tokens int,
  output_tokens int,
  credits_used int not null default 1,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ─── Batch Generations ───────────────────────────────────────────
create table if not exists public.batch_generations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  name text not null,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','cancelled')),
  total_items int not null default 0,
  completed_items int not null default 0,
  failed_items int not null default 0,
  credits_reserved int not null default 0,
  credits_used int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- ─── Keywords ────────────────────────────────────────────────────
create table if not exists public.keywords (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  keyword text not null,
  country text,
  language text,
  volume int,
  difficulty int,
  cpc numeric(10,2),
  intent text,
  created_at timestamptz not null default now()
);

-- ─── Keyword Clusters ────────────────────────────────────────────
create table if not exists public.keyword_clusters (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  name text not null,
  primary_keyword text not null,
  keywords jsonb not null default '[]',
  intent text,
  priority int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── Competitor Analyses ─────────────────────────────────────────
create table if not exists public.competitor_analyses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  domain text not null,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ─── Affiliate Links ─────────────────────────────────────────────
create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  name text not null,
  slug text not null,
  destination_url text not null,
  affiliate_url text not null,
  campaign_id uuid,
  product_id uuid,
  notes text,
  click_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, slug)
);

-- ─── Affiliate Products ──────────────────────────────────────────
create table if not exists public.affiliate_products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  name text not null,
  url text,
  affiliate_url text,
  category text,
  description text,
  price numeric(10,2),
  commission_rate numeric(5,2),
  created_at timestamptz not null default now()
);

-- ─── Affiliate Campaigns ─────────────────────────────────────────
create table if not exists public.affiliate_campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Affiliate Clicks ────────────────────────────────────────────
create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.affiliate_links(id) on delete cascade,
  user_agent text,
  referrer text,
  country text,
  device text,
  ip_hash text,
  created_at timestamptz not null default now()
);

-- ─── Automations ─────────────────────────────────────────────────
create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  name text not null,
  description text,
  trigger text not null,
  steps jsonb not null default '[]',
  enabled boolean not null default false,
  run_count int not null default 0,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Automation Runs ─────────────────────────────────────────────
create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error text,
  logs jsonb not null default '[]'
);

-- ─── Integrations ────────────────────────────────────────────────
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('wordpress','blogger','webhook','api')),
  name text not null,
  config jsonb not null default '{}',
  status text not null default 'disconnected' check (status in ('connected','disconnected','error','needs_reauth')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Publishing Jobs ─────────────────────────────────────────────
create table if not exists public.publishing_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing','published','failed','retrying')),
  external_id text,
  external_url text,
  error text,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─── API Keys ────────────────────────────────────────────────────
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- ─── Support Tickets ─────────────────────────────────────────────
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  user_id uuid not null references auth.users(id),
  subject text not null,
  category text not null default 'general',
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'open' check (status in ('open','pending','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Support Messages ────────────────────────────────────────────
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  body text not null,
  is_staff boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── Notifications ───────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('success','info','warning','error')),
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── Feature Flags ───────────────────────────────────────────────
create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  enabled boolean not null default true,
  description text,
  rollout_percent int not null default 100,
  updated_at timestamptz not null default now()
);

-- ─── Audit Logs ──────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id uuid,
  metadata jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- ─── Blog Posts ──────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null default '',
  featured_image text,
  status text not null default 'draft' check (status in ('draft','published','scheduled','archived')),
  author_id uuid not null references auth.users(id),
  category text,
  tags text[] not null default '{}',
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────
create index if not exists idx_workspace_members_workspace on public.workspace_members(workspace_id);
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);
create index if not exists idx_contents_workspace on public.contents(workspace_id, created_at desc);
create index if not exists idx_contents_status on public.contents(workspace_id, status);
create index if not exists idx_generations_workspace on public.generations(workspace_id, created_at desc);
create index if not exists idx_generations_user on public.generations(user_id, created_at desc);
create index if not exists idx_affiliate_clicks_link on public.affiliate_clicks(link_id, created_at desc);
create index if not exists idx_credit_transactions_workspace on public.credit_transactions(workspace_id, created_at desc);
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_keywords_workspace on public.keywords(workspace_id);
create index if not exists idx_projects_workspace on public.projects(workspace_id);
create index if not exists idx_blog_posts_slug on public.blog_posts(slug);
create index if not exists idx_blog_posts_status on public.blog_posts(status, published_at desc);
create index if not exists idx_affiliate_links_slug on public.affiliate_links(workspace_id, slug);

-- ─── Functions ───────────────────────────────────────────────────

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-create workspace + subscription + credit_balance on workspace insert
create or replace function public.handle_new_workspace()
returns trigger as $$
begin
  -- Add owner as member
  insert into public.workspace_members(workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  
  -- Create free subscription
  insert into public.subscriptions(workspace_id, credits_limit)
  values (new.id, 100);
  
  -- Create credit balance
  insert into public.credit_balances(workspace_id, balance)
  values (new.id, 5);
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute procedure public.handle_new_workspace();

-- Deduct credits atomically (server-side only)
create or replace function public.deduct_credits(
  p_workspace_id uuid,
  p_user_id uuid,
  p_amount int,
  p_description text,
  p_reference_type text,
  p_reference_id uuid
) returns boolean as $$
declare
  v_balance int;
begin
  select balance into v_balance
  from public.credit_balances
  where workspace_id = p_workspace_id
  for update;

  if v_balance < p_amount then
    return false;
  end if;

  update public.credit_balances
  set balance = balance - p_amount, updated_at = now()
  where workspace_id = p_workspace_id;

  insert into public.credit_transactions(
    workspace_id, user_id, type, amount, balance_after,
    reference_type, reference_id, description
  ) values (
    p_workspace_id, p_user_id, 'generation', -p_amount, v_balance - p_amount,
    p_reference_type, p_reference_id, p_description
  );

  update public.subscriptions
  set credits_used = credits_used + p_amount
  where workspace_id = p_workspace_id;

  return true;
end;
$$ language plpgsql security definer;

-- Get workspace credit balance
create or replace function public.get_workspace_credits(p_workspace_id uuid)
returns int as $$
  select balance from public.credit_balances where workspace_id = p_workspace_id;
$$ language sql security definer;

-- Update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to all relevant tables
create trigger update_profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at();
create trigger update_workspaces_updated_at before update on public.workspaces for each row execute procedure public.update_updated_at();
create trigger update_subscriptions_updated_at before update on public.subscriptions for each row execute procedure public.update_updated_at();
create trigger update_projects_updated_at before update on public.projects for each row execute procedure public.update_updated_at();
create trigger update_brand_voices_updated_at before update on public.brand_voices for each row execute procedure public.update_updated_at();
create trigger update_templates_updated_at before update on public.templates for each row execute procedure public.update_updated_at();
create trigger update_contents_updated_at before update on public.contents for each row execute procedure public.update_updated_at();
create trigger update_integrations_updated_at before update on public.integrations for each row execute procedure public.update_updated_at();
create trigger update_automations_updated_at before update on public.automations for each row execute procedure public.update_updated_at();
create trigger update_affiliate_links_updated_at before update on public.affiliate_links for each row execute procedure public.update_updated_at();
create trigger update_support_tickets_updated_at before update on public.support_tickets for each row execute procedure public.update_updated_at();
create trigger update_blog_posts_updated_at before update on public.blog_posts for each row execute procedure public.update_updated_at();
