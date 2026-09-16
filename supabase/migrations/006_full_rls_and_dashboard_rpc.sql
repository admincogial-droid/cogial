-- PressLine · Migration 006
-- Full RLS Policies for all tables + Dashboard RPC

-- ─── Enable RLS on all tables that don't have it yet ─────────────

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_balances enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.projects enable row level security;
alter table public.brand_voices enable row level security;
alter table public.templates enable row level security;
alter table public.contents enable row level security;
alter table public.content_versions enable row level security;
alter table public.generations enable row level security;
alter table public.keywords enable row level security;
alter table public.keyword_clusters enable row level security;
alter table public.competitor_analyses enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_products enable row level security;
alter table public.affiliate_campaigns enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.automations enable row level security;
alter table public.automation_runs enable row level security;
alter table public.integrations enable row level security;
alter table public.publishing_jobs enable row level security;
alter table public.api_keys enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.notifications enable row level security;

-- ─── Profiles ────────────────────────────────────────────────────
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());

-- ─── Workspaces ──────────────────────────────────────────────────
drop policy if exists "Members can view workspaces" on public.workspaces;
create policy "Members can view workspaces" on public.workspaces
  for select using (public.is_workspace_member(id));

drop policy if exists "Owners can update workspaces" on public.workspaces;
create policy "Owners can update workspaces" on public.workspaces
  for update using (owner_id = auth.uid());

drop policy if exists "Users can create workspaces" on public.workspaces;
create policy "Users can create workspaces" on public.workspaces
  for insert with check (owner_id = auth.uid());

-- ─── Subscriptions ───────────────────────────────────────────────
drop policy if exists "Members can view subscription" on public.subscriptions;
create policy "Members can view subscription" on public.subscriptions
  for select using (public.is_workspace_member(workspace_id));

-- ─── Credit Balances ─────────────────────────────────────────────
drop policy if exists "Members can view credit balance" on public.credit_balances;
create policy "Members can view credit balance" on public.credit_balances
  for select using (public.is_workspace_member(workspace_id));

-- ─── Credit Transactions ─────────────────────────────────────────
drop policy if exists "Members can view credit transactions" on public.credit_transactions;
create policy "Members can view credit transactions" on public.credit_transactions
  for select using (public.is_workspace_member(workspace_id));

-- ─── Projects ────────────────────────────────────────────────────
drop policy if exists "Members can view projects" on public.projects;
create policy "Members can view projects" on public.projects
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can create projects" on public.projects;
create policy "Members can create projects" on public.projects
  for insert with check (public.is_workspace_member(workspace_id) and user_id = auth.uid());

drop policy if exists "Members can update own projects" on public.projects;
create policy "Members can update own projects" on public.projects
  for update using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete own projects" on public.projects;
create policy "Members can delete own projects" on public.projects
  for delete using (user_id = auth.uid() or public.is_workspace_admin(workspace_id));

-- ─── Brand Voices ────────────────────────────────────────────────
drop policy if exists "Members can view brand voices" on public.brand_voices;
create policy "Members can view brand voices" on public.brand_voices
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage brand voices" on public.brand_voices;
create policy "Members can manage brand voices" on public.brand_voices
  for all using (public.is_workspace_member(workspace_id));

-- ─── Templates ───────────────────────────────────────────────────
drop policy if exists "Anyone can view public templates" on public.templates;
create policy "Anyone can view public templates" on public.templates
  for select using (is_public = true or public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage templates" on public.templates;
create policy "Members can manage templates" on public.templates
  for all using (public.is_workspace_member(workspace_id) or user_id = auth.uid());

-- ─── Contents ────────────────────────────────────────────────────
drop policy if exists "Members can view contents" on public.contents;
create policy "Members can view contents" on public.contents
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can create contents" on public.contents;
create policy "Members can create contents" on public.contents
  for insert with check (public.is_workspace_member(workspace_id) and user_id = auth.uid());

drop policy if exists "Members can update contents" on public.contents;
create policy "Members can update contents" on public.contents
  for update using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete contents" on public.contents;
create policy "Members can delete contents" on public.contents
  for delete using (user_id = auth.uid() or public.is_workspace_admin(workspace_id));

-- ─── Content Versions ────────────────────────────────────────────
drop policy if exists "Members can view versions" on public.content_versions;
create policy "Members can view versions" on public.content_versions
  for select using (
    content_id in (select id from public.contents where public.is_workspace_member(workspace_id))
  );

drop policy if exists "Members can create versions" on public.content_versions;
create policy "Members can create versions" on public.content_versions
  for insert with check (user_id = auth.uid());

-- ─── Generations ─────────────────────────────────────────────────
drop policy if exists "Members can view generations" on public.generations;
create policy "Members can view generations" on public.generations
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can create generations" on public.generations;
create policy "Members can create generations" on public.generations
  for insert with check (public.is_workspace_member(workspace_id) and user_id = auth.uid());

drop policy if exists "Members can update own generations" on public.generations;
create policy "Members can update own generations" on public.generations
  for update using (user_id = auth.uid());

-- ─── Keywords ────────────────────────────────────────────────────
drop policy if exists "Members can view keywords" on public.keywords;
create policy "Members can view keywords" on public.keywords
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage keywords" on public.keywords;
create policy "Members can manage keywords" on public.keywords
  for all using (public.is_workspace_member(workspace_id));

-- ─── Keyword Clusters ────────────────────────────────────────────
drop policy if exists "Members can manage clusters" on public.keyword_clusters;
create policy "Members can manage clusters" on public.keyword_clusters
  for all using (public.is_workspace_member(workspace_id));

-- ─── Competitor Analyses ─────────────────────────────────────────
drop policy if exists "Members can manage analyses" on public.competitor_analyses;
create policy "Members can manage analyses" on public.competitor_analyses
  for all using (public.is_workspace_member(workspace_id));

-- ─── Affiliate Links ─────────────────────────────────────────────
drop policy if exists "Members can view affiliate links" on public.affiliate_links;
create policy "Members can view affiliate links" on public.affiliate_links
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage affiliate links" on public.affiliate_links;
create policy "Members can manage affiliate links" on public.affiliate_links
  for all using (public.is_workspace_member(workspace_id));

-- ─── Affiliate Products ──────────────────────────────────────────
drop policy if exists "Members can manage products" on public.affiliate_products;
create policy "Members can manage products" on public.affiliate_products
  for all using (public.is_workspace_member(workspace_id));

-- ─── Affiliate Campaigns ─────────────────────────────────────────
drop policy if exists "Members can manage campaigns" on public.affiliate_campaigns;
create policy "Members can manage campaigns" on public.affiliate_campaigns
  for all using (public.is_workspace_member(workspace_id));

-- ─── Automations ─────────────────────────────────────────────────
drop policy if exists "Members can view automations" on public.automations;
create policy "Members can view automations" on public.automations
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage automations" on public.automations;
create policy "Members can manage automations" on public.automations
  for all using (public.is_workspace_member(workspace_id));

-- ─── Automation Runs ─────────────────────────────────────────────
drop policy if exists "Members can view automation runs" on public.automation_runs;
create policy "Members can view automation runs" on public.automation_runs
  for select using (public.is_workspace_member(workspace_id));

-- ─── Integrations ────────────────────────────────────────────────
drop policy if exists "Members can view integrations" on public.integrations;
create policy "Members can view integrations" on public.integrations
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Admins can manage integrations" on public.integrations;
create policy "Admins can manage integrations" on public.integrations
  for all using (public.is_workspace_admin(workspace_id));

drop policy if exists "Members can create integrations" on public.integrations;
create policy "Members can create integrations" on public.integrations
  for insert with check (public.is_workspace_member(workspace_id) and user_id = auth.uid());

-- ─── Support Tickets ─────────────────────────────────────────────
drop policy if exists "Users can view own tickets" on public.support_tickets;
create policy "Users can view own tickets" on public.support_tickets
  for select using (user_id = auth.uid());

drop policy if exists "Users can create tickets" on public.support_tickets;
create policy "Users can create tickets" on public.support_tickets
  for insert with check (user_id = auth.uid());

-- ─── Support Messages ────────────────────────────────────────────
drop policy if exists "Users can view ticket messages" on public.support_messages;
create policy "Users can view ticket messages" on public.support_messages
  for select using (
    ticket_id in (select id from public.support_tickets where user_id = auth.uid())
  );

drop policy if exists "Users can create messages" on public.support_messages;
create policy "Users can create messages" on public.support_messages
  for insert with check (user_id = auth.uid());

-- ─── Notifications ───────────────────────────────────────────────
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications
  for update using (user_id = auth.uid());

-- ─── API Keys ────────────────────────────────────────────────────
drop policy if exists "Members can view api keys" on public.api_keys;
create policy "Members can view api keys" on public.api_keys
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Admins can manage api keys" on public.api_keys;
create policy "Admins can manage api keys" on public.api_keys
  for all using (public.is_workspace_admin(workspace_id));

-- ─── Dashboard Overview RPC ──────────────────────────────────────

create or replace function public.get_dashboard_overview(p_workspace_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_content_count int;
  v_word_count bigint;
  v_generation_count int;
  v_credit_balance int;
  v_credits_used int;
  v_credits_limit int;
  v_recent_content json;
  v_recent_generations json;
  v_this_month_content int;
  v_last_month_content int;
begin
  -- Verify membership
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Unauthorized';
  end if;

  -- Aggregate counts
  select count(*), coalesce(sum(word_count), 0)
    into v_content_count, v_word_count
    from public.contents
    where workspace_id = p_workspace_id;

  select count(*)
    into v_generation_count
    from public.generations
    where workspace_id = p_workspace_id;

  select balance
    into v_credit_balance
    from public.credit_balances
    where workspace_id = p_workspace_id;

  select credits_used, credits_limit
    into v_credits_used, v_credits_limit
    from public.subscriptions
    where workspace_id = p_workspace_id;

  -- This month content
  select count(*)
    into v_this_month_content
    from public.contents
    where workspace_id = p_workspace_id
      and created_at >= date_trunc('month', now());

  -- Last month content
  select count(*)
    into v_last_month_content
    from public.contents
    where workspace_id = p_workspace_id
      and created_at >= date_trunc('month', now() - interval '1 month')
      and created_at < date_trunc('month', now());

  -- Recent content (5 items)
  select coalesce(json_agg(r), '[]'::json)
    into v_recent_content
    from (
      select id, title, type, status, word_count, created_at
        from public.contents
        where workspace_id = p_workspace_id
        order by created_at desc
        limit 5
    ) r;

  -- Recent generations (5 items)
  select coalesce(json_agg(r), '[]'::json)
    into v_recent_generations
    from (
      select id, type, model, status, credits_used, created_at
        from public.generations
        where workspace_id = p_workspace_id
        order by created_at desc
        limit 5
    ) r;

  return json_build_object(
    'content_count', coalesce(v_content_count, 0),
    'word_count', coalesce(v_word_count, 0),
    'generation_count', coalesce(v_generation_count, 0),
    'credit_balance', coalesce(v_credit_balance, 0),
    'credits_used', coalesce(v_credits_used, 0),
    'credits_limit', coalesce(v_credits_limit, 100),
    'this_month_content', coalesce(v_this_month_content, 0),
    'last_month_content', coalesce(v_last_month_content, 0),
    'recent_content', coalesce(v_recent_content, '[]'::json),
    'recent_generations', coalesce(v_recent_generations, '[]'::json)
  );
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.get_dashboard_overview(uuid) to authenticated;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;
grant execute on function public.get_workspace_credits(uuid) to authenticated;
grant execute on function public.deduct_credits(uuid, uuid, int, text, text, uuid) to authenticated;
