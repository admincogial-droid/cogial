-- PressLine · Production Completion Migration 007
-- Comprehensive Schema, Atomic Credit Ledger, RPCs, and RLS

-- ─── 1. EXTENSIONS ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── 2. ATOMIC CREDIT BALANCES & TRANSACTIONS ─────────────────────

-- Ensure credit_balances exists with correct columns
create table if not exists public.credit_balances (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  balance int not null default 100 check (balance >= 0),
  monthly_limit int not null default 100,
  reset_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Credit transactions ledger
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('generation', 'refund', 'purchase', 'bonus', 'reset', 'subscription')),
  amount int not null, -- negative for deductions, positive for credits/refunds
  balance_after int not null,
  operation text,
  reference_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_transactions_ws_created on public.credit_transactions(workspace_id, created_at desc);

-- ─── 3. ENHANCE CONTENTS TABLE ────────────────────────────────────

alter table public.contents add column if not exists excerpt text;
alter table public.contents add column if not exists reading_time int default 1;
alter table public.contents add column if not exists featured_image_url text;
alter table public.contents add column if not exists primary_keyword text;
alter table public.contents add column if not exists secondary_keywords text[] default '{}';
alter table public.contents add column if not exists seo_title text;
alter table public.contents add column if not exists seo_description text;
alter table public.contents add column if not exists published_at timestamptz;
alter table public.contents add column if not exists character_count int default 0;

create index if not exists idx_contents_ws_status on public.contents(workspace_id, status);
create index if not exists idx_contents_ws_created on public.contents(workspace_id, created_at desc);
create index if not exists idx_contents_project on public.contents(project_id);

-- ─── 4. ENHANCE TEMPLATES & BRAND VOICES ──────────────────────────

alter table public.templates add column if not exists prompt_template text;
alter table public.templates add column if not exists input_schema jsonb default '[]'::jsonb;
alter table public.templates add column if not exists output_schema jsonb default '{}'::jsonb;
alter table public.templates add column if not exists is_system boolean default false;

alter table public.brand_voices add column if not exists style_rules text;
alter table public.brand_voices add column if not exists avoid_rules text;
alter table public.brand_voices add column if not exists example_content text;

-- ─── 5. ENHANCE AI GENERATIONS TABLE ─────────────────────────────

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  tool_id text not null,
  operation text,
  model text not null default 'google/gemini-2.5-flash',
  provider text not null default 'openrouter',
  prompt_version text default 'v1',
  input_data jsonb not null default '{}'::jsonb,
  output_data jsonb,
  status text not null default 'processing' check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  credits_reserved int not null default 1,
  credits_used int not null default 0,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  total_tokens int not null default 0,
  estimated_cost numeric(10, 6) default 0,
  duration_ms int not null default 0,
  error_code text,
  error_message text,
  request_id text,
  content_id uuid references public.contents(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_ai_generations_ws_created on public.ai_generations(workspace_id, created_at desc);
create index if not exists idx_ai_generations_tool on public.ai_generations(tool_id);

-- ─── 6. AUTOMATION RUNS & SETTINGS ────────────────────────────────

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  status text not null check (status in ('running', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  result jsonb default '{}'::jsonb,
  error text
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, key)
);

-- ─── 7. AFFILIATE CLICKS COUNTER TRIGGER ──────────────────────────

create or replace function public.on_affiliate_click_inserted()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.affiliate_links
  set click_count = click_count + 1,
      updated_at = now()
  where id = NEW.link_id;
  return NEW;
end;
$$;

drop trigger if exists trg_affiliate_click on public.affiliate_clicks;
create trigger trg_affiliate_click
after insert on public.affiliate_clicks
for each row execute function public.on_affiliate_click_inserted();

-- ─── 8. ATOMIC CREDIT OPERATIONS (RPCs) ───────────────────────────

-- Deduct credits atomically preventing negative balance
create or replace function public.consume_ai_credits(
  p_workspace_id uuid,
  p_user_id uuid,
  p_amount int,
  p_operation text default 'generation',
  p_reference_id uuid default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_balance int;
  v_new_balance int;
  v_tx_id uuid;
begin
  -- Validate positive amount
  if p_amount <= 0 then
    p_amount := 1;
  end if;

  -- Verify caller is workspace member
  if not public.is_workspace_member(p_workspace_id) then
    return json_build_object('success', false, 'error', 'Unauthorized workspace member');
  end if;

  -- Lock row for update
  select balance into v_current_balance
  from public.credit_balances
  where workspace_id = p_workspace_id
  for update;

  if v_current_balance is null then
    -- Initialize if missing
    insert into public.credit_balances (workspace_id, balance, monthly_limit)
    values (p_workspace_id, 100, 100)
    returning balance into v_current_balance;
  end if;

  if v_current_balance < p_amount then
    return json_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'balance', v_current_balance,
      'required', p_amount
    );
  end if;

  v_new_balance := v_current_balance - p_amount;

  update public.credit_balances
  set balance = v_new_balance,
      updated_at = now()
  where workspace_id = p_workspace_id;

  -- Insert ledger entry
  insert into public.credit_transactions (
    workspace_id, user_id, type, amount, balance_after, operation, reference_id
  ) values (
    p_workspace_id, p_user_id, 'generation', -p_amount, v_new_balance, p_operation, p_reference_id
  ) returning id into v_tx_id;

  -- Also update subscription credits_used if row exists
  update public.subscriptions
  set credits_used = credits_used + p_amount,
      updated_at = now()
  where workspace_id = p_workspace_id;

  return json_build_object(
    'success', true,
    'balance', v_new_balance,
    'deducted', p_amount,
    'transaction_id', v_tx_id
  );
end;
$$;

-- Refund credits on generation failure
create or replace function public.refund_ai_credits(
  p_workspace_id uuid,
  p_user_id uuid,
  p_amount int,
  p_operation text default 'refund',
  p_reference_id uuid default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_balance int;
  v_new_balance int;
  v_tx_id uuid;
begin
  if p_amount <= 0 then
    p_amount := 1;
  end if;

  select balance into v_current_balance
  from public.credit_balances
  where workspace_id = p_workspace_id
  for update;

  v_new_balance := coalesce(v_current_balance, 0) + p_amount;

  update public.credit_balances
  set balance = v_new_balance,
      updated_at = now()
  where workspace_id = p_workspace_id;

  insert into public.credit_transactions (
    workspace_id, user_id, type, amount, balance_after, operation, reference_id
  ) values (
    p_workspace_id, p_user_id, 'refund', p_amount, v_new_balance, p_operation, p_reference_id
  ) returning id into v_tx_id;

  update public.subscriptions
  set credits_used = greatest(0, credits_used - p_amount),
      updated_at = now()
  where workspace_id = p_workspace_id;

  return json_build_object(
    'success', true,
    'balance', v_new_balance,
    'refunded', p_amount,
    'transaction_id', v_tx_id
  );
end;
$$;

-- Maintain backward-compatibility for deduct_credits
create or replace function public.deduct_credits(
  p_workspace_id uuid,
  p_user_id uuid,
  p_amount int,
  p_description text default null,
  p_reference_type text default null,
  p_reference_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res json;
begin
  if p_amount < 0 then
    v_res := public.refund_ai_credits(p_workspace_id, p_user_id, abs(p_amount), coalesce(p_description, 'refund'), p_reference_id);
  else
    v_res := public.consume_ai_credits(p_workspace_id, p_user_id, p_amount, coalesce(p_description, 'generation'), p_reference_id);
  end if;
  return (v_res->>'success')::boolean;
end;
$$;

-- ─── 9. OPTIMIZED DASHBOARD METRICS RPC ───────────────────────────

create or replace function public.get_dashboard_metrics(
  p_workspace_id uuid,
  p_timeframe text default '7d'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_since timestamptz;
  v_days int;
  v_credits_remaining int := 0;
  v_credits_used int := 0;
  v_credits_limit int := 100;
  v_content_created int := 0;
  v_words_generated bigint := 0;
  v_published_articles int := 0;
  v_affiliate_clicks bigint := 0;
  v_daily_usage json := '[]'::json;
  v_recent_content json := '[]'::json;
  v_recent_generations json := '[]'::json;
begin
  -- Validate workspace membership
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Unauthorized';
  end if;

  -- Determine start time
  if p_timeframe = '30d' then
    v_days := 30;
    v_since := now() - interval '30 days';
  elsif p_timeframe = '90d' then
    v_days := 90;
    v_since := now() - interval '90 days';
  elsif p_timeframe = 'all' then
    v_days := 365;
    v_since := '2000-01-01'::timestamptz;
  else
    v_days := 7;
    v_since := now() - interval '7 days';
  end if;

  -- 1. AI Credits Left
  select coalesce(balance, 0), coalesce(monthly_limit, 100)
    into v_credits_remaining, v_credits_limit
    from public.credit_balances
    where workspace_id = p_workspace_id;

  select coalesce(credits_used, 0)
    into v_credits_used
    from public.subscriptions
    where workspace_id = p_workspace_id;

  -- 2. Content Created & Words Generated during timeframe
  select count(*), coalesce(sum(word_count), 0)
    into v_content_created, v_words_generated
    from public.contents
    where workspace_id = p_workspace_id
      and created_at >= v_since;

  -- 3. Published Articles during timeframe
  select count(*)
    into v_published_articles
    from public.contents
    where workspace_id = p_workspace_id
      and status = 'published'
      and (published_at >= v_since or (published_at is null and created_at >= v_since));

  -- 4. Affiliate Clicks
  select coalesce(sum(l.click_count), 0)
    into v_affiliate_clicks
    from public.affiliate_links l
    where l.workspace_id = p_workspace_id;

  -- 5. Daily credit usage for chart
  select coalesce(json_agg(row_to_json(d)), '[]'::json)
    into v_daily_usage
    from (
      select
        to_char(series.day, 'MM-DD') as date,
        coalesce(sum(abs(t.amount)), 0)::int as credits,
        count(t.id)::int as generations
      from generate_series(
        date_trunc('day', now() - (interval '1 day' * (least(v_days, 30) - 1))),
        date_trunc('day', now()),
        interval '1 day'
      ) as series(day)
      left join public.credit_transactions t
        on date_trunc('day', t.created_at) = series.day
        and t.workspace_id = p_workspace_id
        and t.type = 'generation'
      group by series.day
      order by series.day
    ) d;

  -- 6. Recent content (5 items metadata only)
  select coalesce(json_agg(row_to_json(rc)), '[]'::json)
    into v_recent_content
    from (
      select id, title, type, status, word_count, created_at, updated_at, published_at
      from public.contents
      where workspace_id = p_workspace_id
      order by created_at desc
      limit 5
    ) rc;

  -- 7. Recent generations (5 items)
  select coalesce(json_agg(row_to_json(rg)), '[]'::json)
    into v_recent_generations
    from (
      select id, coalesce(operation, tool_id) as tool_id, model, status, credits_used, created_at
      from public.ai_generations
      where workspace_id = p_workspace_id
      order by created_at desc
      limit 5
    ) rg;

  return json_build_object(
    'credits_remaining', v_credits_remaining,
    'credits_used', v_credits_used,
    'credits_limit', v_credits_limit,
    'content_created', v_content_created,
    'words_generated', v_words_generated,
    'published_articles', v_published_articles,
    'affiliate_clicks', v_affiliate_clicks,
    'daily_credit_usage', v_daily_usage,
    'recent_content', v_recent_content,
    'recent_generations', v_recent_generations
  );
end;
$$;

-- ─── 10. OPTIMIZED ANALYTICS OVERVIEW RPC ─────────────────────────

create or replace function public.get_analytics_overview(
  p_workspace_id uuid,
  p_days int default 30
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_since timestamptz;
  v_totals json;
  v_content_by_day json;
  v_credits_by_day json;
  v_content_by_type json;
  v_top_content json;
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Unauthorized';
  end if;

  v_since := now() - (interval '1 day' * p_days);

  -- Totals
  select json_build_object(
    'total_content', (select count(*) from public.contents where workspace_id = p_workspace_id),
    'words_generated', (select coalesce(sum(word_count), 0) from public.contents where workspace_id = p_workspace_id),
    'generations_count', (select count(*) from public.ai_generations where workspace_id = p_workspace_id),
    'published_content', (select count(*) from public.contents where workspace_id = p_workspace_id and status = 'published'),
    'affiliate_clicks', (select coalesce(sum(click_count), 0) from public.affiliate_links where workspace_id = p_workspace_id)
  ) into v_totals;

  -- Content created by day
  select coalesce(json_agg(row_to_json(cbd)), '[]'::json)
    into v_content_by_day
    from (
      select
        to_char(series.day, 'MM-DD') as date,
        count(c.id)::int as count
      from generate_series(
        date_trunc('day', v_since),
        date_trunc('day', now()),
        interval '1 day'
      ) as series(day)
      left join public.contents c
        on date_trunc('day', c.created_at) = series.day
        and c.workspace_id = p_workspace_id
      group by series.day
      order by series.day
    ) cbd;

  -- Credits by day
  select coalesce(json_agg(row_to_json(crbd)), '[]'::json)
    into v_credits_by_day
    from (
      select
        to_char(series.day, 'MM-DD') as date,
        coalesce(sum(abs(t.amount)), 0)::int as credits
      from generate_series(
        date_trunc('day', v_since),
        date_trunc('day', now()),
        interval '1 day'
      ) as series(day)
      left join public.credit_transactions t
        on date_trunc('day', t.created_at) = series.day
        and t.workspace_id = p_workspace_id
        and t.type = 'generation'
      group by series.day
      order by series.day
    ) crbd;

  -- Content breakdown by type
  select coalesce(json_agg(row_to_json(cbt)), '[]'::json)
    into v_content_by_type
    from (
      select type as name, count(*)::int as value
      from public.contents
      where workspace_id = p_workspace_id
      group by type
      order by value desc
      limit 6
    ) cbt;

  -- Top 5 content by word count
  select coalesce(json_agg(row_to_json(tc)), '[]'::json)
    into v_top_content
    from (
      select id, title, type, status, word_count, created_at
      from public.contents
      where workspace_id = p_workspace_id
      order by word_count desc
      limit 5
    ) tc;

  return json_build_object(
    'totals', v_totals,
    'content_by_day', v_content_by_day,
    'credits_by_day', v_credits_by_day,
    'content_by_type', v_content_by_type,
    'top_content', v_top_content
  );
end;
$$;

-- ─── 11. SERVER-SIDE SEARCH RPC ───────────────────────────────────

create or replace function public.search_workspace(
  p_workspace_id uuid,
  p_query text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_term text := '%' || lower(trim(p_query)) || '%';
  v_contents json;
  v_projects json;
  v_templates json;
  v_keywords json;
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Unauthorized';
  end if;

  if length(trim(p_query)) < 2 then
    return json_build_object('contents', '[]'::json, 'projects', '[]'::json, 'templates', '[]'::json, 'keywords', '[]'::json);
  end if;

  -- Contents (limit 5)
  select coalesce(json_agg(row_to_json(c)), '[]'::json)
    into v_contents
    from (
      select id, title, type, status, created_at
      from public.contents
      where workspace_id = p_workspace_id
        and (lower(title) like v_term or lower(type) like v_term)
      order by created_at desc
      limit 5
    ) c;

  -- Projects (limit 4)
  select coalesce(json_agg(row_to_json(p)), '[]'::json)
    into v_projects
    from (
      select id, name, description, created_at
      from public.projects
      where workspace_id = p_workspace_id
        and (lower(name) like v_term or lower(coalesce(description, '')) like v_term)
      order by created_at desc
      limit 4
    ) p;

  -- Templates (limit 4)
  select coalesce(json_agg(row_to_json(t)), '[]'::json)
    into v_templates
    from (
      select id, name, category, description
      from public.templates
      where (workspace_id = p_workspace_id or is_public = true)
        and (lower(name) like v_term or lower(category) like v_term)
      order by name
      limit 4
    ) t;

  -- Keywords (limit 4)
  select coalesce(json_agg(row_to_json(k)), '[]'::json)
    into v_keywords
    from (
      select id, keyword, intent, volume, difficulty
      from public.keywords
      where workspace_id = p_workspace_id
        and lower(keyword) like v_term
      order by created_at desc
      limit 4
    ) k;

  return json_build_object(
    'contents', v_contents,
    'projects', v_projects,
    'templates', v_templates,
    'keywords', v_keywords
  );
end;
$$;

-- ─── 12. RLS & PERMISSIONS ────────────────────────────────────────

alter table public.credit_balances enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.ai_generations enable row level security;
alter table public.automation_runs enable row level security;
alter table public.settings enable row level security;

-- Policies for credit_balances
drop policy if exists "Members view credit balance" on public.credit_balances;
create policy "Members view credit balance" on public.credit_balances
  for select using (public.is_workspace_member(workspace_id));

-- Policies for credit_transactions
drop policy if exists "Members view credit txns" on public.credit_transactions;
create policy "Members view credit txns" on public.credit_transactions
  for select using (public.is_workspace_member(workspace_id));

-- Policies for ai_generations
drop policy if exists "Members view ai_generations" on public.ai_generations;
create policy "Members view ai_generations" on public.ai_generations
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Members insert ai_generations" on public.ai_generations;
create policy "Members insert ai_generations" on public.ai_generations
  for insert with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members update ai_generations" on public.ai_generations;
create policy "Members update ai_generations" on public.ai_generations
  for update using (public.is_workspace_member(workspace_id));

-- Policies for automation_runs
drop policy if exists "Members view automation runs" on public.automation_runs;
create policy "Members view automation runs" on public.automation_runs
  for select using (public.is_workspace_member(workspace_id));

-- Policies for settings
drop policy if exists "Members view settings" on public.settings;
create policy "Members view settings" on public.settings
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Admins manage settings" on public.settings;
create policy "Admins manage settings" on public.settings
  for all using (public.is_workspace_admin(workspace_id));

-- Grant RPC execution
grant execute on function public.consume_ai_credits(uuid, uuid, int, text, uuid) to authenticated;
grant execute on function public.refund_ai_credits(uuid, uuid, int, text, uuid) to authenticated;
grant execute on function public.deduct_credits(uuid, uuid, int, text, text, uuid) to authenticated;
grant execute on function public.get_dashboard_metrics(uuid, text) to authenticated;
grant execute on function public.get_analytics_overview(uuid, int) to authenticated;
grant execute on function public.search_workspace(uuid, text) to authenticated;
