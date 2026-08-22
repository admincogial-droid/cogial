-- NovaPilot · RLS Policies Migration 002

-- ─── Profiles ────────────────────────────────────────────────────
alter table public.profiles enable row level security;
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- ─── Workspaces ──────────────────────────────────────────────────
alter table public.workspaces enable row level security;
create policy "Members view workspace" on public.workspaces for select
  using (exists (select 1 from public.workspace_members where workspace_id = id and user_id = auth.uid()));
create policy "Owner updates workspace" on public.workspaces for update
  using (owner_id = auth.uid());
create policy "Authenticated users create workspace" on public.workspaces for insert
  with check (auth.uid() = owner_id);

-- ─── Workspace Members ───────────────────────────────────────────
alter table public.workspace_members enable row level security;
create policy "Members view members" on public.workspace_members for select
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));
create policy "Admins manage members" on public.workspace_members for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role in ('owner','admin')));

-- ─── Workspace Invitations ───────────────────────────────────────
alter table public.workspace_invitations enable row level security;
create policy "Admins manage invitations" on public.workspace_invitations for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role in ('owner','admin')));
create policy "Anyone can view invitation by token" on public.workspace_invitations for select
  using (true);

-- ─── Plans ───────────────────────────────────────────────────────
alter table public.plans enable row level security;
create policy "Anyone views active plans" on public.plans for select using (is_active = true);
create policy "Admins manage plans" on public.plans for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ─── Subscriptions ───────────────────────────────────────────────
alter table public.subscriptions enable row level security;
create policy "Members view subscription" on public.subscriptions for select
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Credit Balances ─────────────────────────────────────────────
alter table public.credit_balances enable row level security;
create policy "Members view credit balance" on public.credit_balances for select
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Credit Transactions ─────────────────────────────────────────
alter table public.credit_transactions enable row level security;
create policy "Members view credit transactions" on public.credit_transactions for select
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Projects ────────────────────────────────────────────────────
alter table public.projects enable row level security;
create policy "Members view projects" on public.projects for select
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));
create policy "Editors create projects" on public.projects for insert
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role in ('owner','admin','editor','member')));
create policy "Editors update projects" on public.projects for update
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role in ('owner','admin','editor','member')));
create policy "Admins delete projects" on public.projects for delete
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role in ('owner','admin')));

-- ─── Brand Voices ────────────────────────────────────────────────
alter table public.brand_voices enable row level security;
create policy "Members view brand voices" on public.brand_voices for select
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));
create policy "Members manage brand voices" on public.brand_voices for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role in ('owner','admin','editor','member')));

-- ─── Templates ───────────────────────────────────────────────────
alter table public.templates enable row level security;
create policy "Members view templates" on public.templates for select
  using (is_public = true or (workspace_id is not null and exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid())));
create policy "Members manage templates" on public.templates for all
  using (user_id = auth.uid());

-- ─── Contents ────────────────────────────────────────────────────
alter table public.contents enable row level security;
create policy "Members view contents" on public.contents for select
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));
create policy "Editors create contents" on public.contents for insert
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role in ('owner','admin','editor','member')));
create policy "Editors update contents" on public.contents for update
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role in ('owner','admin','editor','member')));
create policy "Admins delete contents" on public.contents for delete
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role in ('owner','admin')));

-- ─── Content Versions ────────────────────────────────────────────
alter table public.content_versions enable row level security;
create policy "Members view content versions" on public.content_versions for select
  using (exists (select 1 from public.contents c join public.workspace_members wm on wm.workspace_id = c.workspace_id where c.id = content_id and wm.user_id = auth.uid()));
create policy "Editors create content versions" on public.content_versions for insert
  with check (user_id = auth.uid());

-- ─── Generations ─────────────────────────────────────────────────
alter table public.generations enable row level security;
create policy "Members view generations" on public.generations for select
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));
create policy "Members create generations" on public.generations for insert
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Batch Generations ───────────────────────────────────────────
alter table public.batch_generations enable row level security;
create policy "Members manage batch generations" on public.batch_generations for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Keywords ────────────────────────────────────────────────────
alter table public.keywords enable row level security;
create policy "Members manage keywords" on public.keywords for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Keyword Clusters ────────────────────────────────────────────
alter table public.keyword_clusters enable row level security;
create policy "Members manage keyword clusters" on public.keyword_clusters for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Competitor Analyses ─────────────────────────────────────────
alter table public.competitor_analyses enable row level security;
create policy "Members manage competitor analyses" on public.competitor_analyses for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Affiliate Links ─────────────────────────────────────────────
alter table public.affiliate_links enable row level security;
create policy "Members manage affiliate links" on public.affiliate_links for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Affiliate Products ──────────────────────────────────────────
alter table public.affiliate_products enable row level security;
create policy "Members manage affiliate products" on public.affiliate_products for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Affiliate Campaigns ─────────────────────────────────────────
alter table public.affiliate_campaigns enable row level security;
create policy "Members manage affiliate campaigns" on public.affiliate_campaigns for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Affiliate Clicks (write-only for tracking, read via workspace) ──
alter table public.affiliate_clicks enable row level security;
create policy "Anyone inserts affiliate clicks" on public.affiliate_clicks for insert with check (true);
create policy "Members view affiliate clicks" on public.affiliate_clicks for select
  using (exists (select 1 from public.affiliate_links al join public.workspace_members wm on wm.workspace_id = al.workspace_id where al.id = link_id and wm.user_id = auth.uid()));

-- ─── Automations ─────────────────────────────────────────────────
alter table public.automations enable row level security;
create policy "Members manage automations" on public.automations for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Automation Runs ─────────────────────────────────────────────
alter table public.automation_runs enable row level security;
create policy "Members view automation runs" on public.automation_runs for select
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Integrations ────────────────────────────────────────────────
alter table public.integrations enable row level security;
create policy "Members manage integrations" on public.integrations for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── Publishing Jobs ─────────────────────────────────────────────
alter table public.publishing_jobs enable row level security;
create policy "Members view publishing jobs" on public.publishing_jobs for select
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid()));

-- ─── API Keys ────────────────────────────────────────────────────
alter table public.api_keys enable row level security;
create policy "Admins manage api keys" on public.api_keys for all
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = auth.uid() and wm.role in ('owner','admin')));

-- ─── Support Tickets ─────────────────────────────────────────────
alter table public.support_tickets enable row level security;
create policy "Users view own tickets" on public.support_tickets for select using (user_id = auth.uid());
create policy "Users create tickets" on public.support_tickets for insert with check (user_id = auth.uid());
create policy "Admins manage all tickets" on public.support_tickets for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ─── Support Messages ────────────────────────────────────────────
alter table public.support_messages enable row level security;
create policy "Users view ticket messages" on public.support_messages for select
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()));
create policy "Users create ticket messages" on public.support_messages for insert
  with check (user_id = auth.uid());

-- ─── Notifications ───────────────────────────────────────────────
alter table public.notifications enable row level security;
create policy "Users view own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "Users update own notifications" on public.notifications for update using (user_id = auth.uid());

-- ─── Feature Flags ───────────────────────────────────────────────
alter table public.feature_flags enable row level security;
create policy "Anyone reads feature flags" on public.feature_flags for select using (true);
create policy "Admins manage feature flags" on public.feature_flags for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ─── Audit Logs ──────────────────────────────────────────────────
alter table public.audit_logs enable row level security;
create policy "Admins view audit logs" on public.audit_logs for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "System inserts audit logs" on public.audit_logs for insert with check (true);

-- ─── Blog Posts ──────────────────────────────────────────────────
alter table public.blog_posts enable row level security;
create policy "Anyone views published blog posts" on public.blog_posts for select using (status = 'published');
create policy "Admins manage blog posts" on public.blog_posts for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
