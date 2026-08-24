-- AI Creator & Marketing Tool Suite Schema
-- Tables: ai_models, ai_tools, ai_generations, media_assets, etc.

-- ─── AI Models ───────────────────────────────────────────────────
create table if not exists public.ai_models (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'openrouter',
  model_id text not null,
  display_name text not null,
  purpose text not null default 'general',
  is_active boolean not null default true,
  is_default boolean not null default false,
  cost_multiplier numeric(5,2) not null default 1.00,
  max_output_tokens int not null default 4096,
  max_input_tokens int not null default 128000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── AI Tools Configuration ───────────────────────────────────────
create table if not exists public.ai_tools (
  id text primary key, -- 'cold-email', 'social-posts', etc.
  name text not null,
  category text not null,
  description text,
  base_credit_cost int not null default 1,
  is_active boolean not null default true,
  plan_requirement text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── AI Generations (The unified history) ───────────────────────
create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  tool_id text not null references public.ai_tools(id),
  model text not null,
  prompt_version text not null default 'v1',
  input_data jsonb not null default '{}',
  output_data jsonb,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed','cancelled')),
  credits_reserved int not null default 0,
  credits_used int not null default 0,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  duration_ms int not null default 0,
  error_code text,
  error_message text,
  is_saved boolean not null default false,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ─── Media Assets (For Thumbnails and Audio) ─────────────────────
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('image', 'audio', 'video')),
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size int not null default 0,
  width int,
  height int,
  duration numeric(10,2),
  source text not null default 'generated',
  metadata jsonb not null default '{}',
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Tool Favorites ──────────────────────────────────────────────
create table if not exists public.ai_tool_favorites (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_id text not null references public.ai_tools(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id, tool_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────
create index if not exists idx_ai_generations_workspace on public.ai_generations(workspace_id, created_at desc);
create index if not exists idx_ai_generations_user on public.ai_generations(user_id, created_at desc);
create index if not exists idx_ai_generations_tool on public.ai_generations(tool_id);
create index if not exists idx_media_assets_workspace on public.media_assets(workspace_id, created_at desc);

-- ─── Triggers ────────────────────────────────────────────────────
create trigger update_ai_models_updated_at before update on public.ai_models for each row execute procedure public.update_updated_at();
create trigger update_ai_tools_updated_at before update on public.ai_tools for each row execute procedure public.update_updated_at();
create trigger update_ai_generations_updated_at before update on public.ai_generations for each row execute procedure public.update_updated_at();
create trigger update_media_assets_updated_at before update on public.media_assets for each row execute procedure public.update_updated_at();

-- ─── Initial Seed Data ───────────────────────────────────────────
insert into public.ai_models (provider, model_id, display_name, purpose, is_default, cost_multiplier)
values 
  ('openrouter', 'google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'fast', true, 1.00),
  ('openrouter', 'google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'quality', false, 3.00),
  ('openrouter', 'anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'quality', false, 4.00)
on conflict do nothing;

insert into public.ai_tools (id, name, category, description, base_credit_cost)
values
  ('cold-email', 'Cold Email Script', 'writing', 'Generate highly-converting cold outreach emails.', 2),
  ('social-posts', 'Social Media Posts', 'social', 'Create tailored posts for various platforms.', 2),
  ('youtube-description', 'YouTube Description', 'youtube', 'SEO-friendly descriptions with timestamps.', 2),
  ('product-description', 'Product Description', 'writing', 'Compelling descriptions for your products.', 2),
  ('article-rewriter', 'Article Rewriter', 'writing', 'Rewrite articles for clarity or different tone.', 3),
  ('video-script', 'Video Script Generator', 'video', 'Full video scripts with hooks and outlines.', 5),
  ('paragraph-writer', 'Paragraph Writer', 'writing', 'Generate quick paragraphs on any topic.', 1),
  ('social-tags', 'Social Tags Generator', 'social', 'Relevant hashtags and tags for your posts.', 1),
  ('meta-title', 'Meta Title Generator', 'seo', 'SEO-optimized meta titles and descriptions.', 1),
  ('hooks', 'Hook Generator', 'social', 'Catchy hooks to grab your audience''s attention.', 1),
  ('topic-research', 'Topic Research', 'seo', 'Detailed research overview and angles.', 5),
  ('script-outline', 'Script Outline', 'video', 'Structured outlines for your videos.', 2),
  ('metadata', 'Metadata Generator', 'seo', 'Comprehensive metadata for your content.', 2),
  ('script-summarizer', 'Script Summarizer', 'video', 'Summarize long scripts into key points.', 2),
  ('documentary', 'Documentary Script', 'video', 'Long-form, detailed documentary scripts.', 10),
  ('community-post', 'Community Post Generator', 'social', 'Engaging posts for community tabs and groups.', 2),
  ('thumbnail-generator', 'Thumbnail Generator', 'creative', 'AI-generated image thumbnails.', 5),
  ('text-to-voice', 'Text to Voiceover', 'voice', 'Realistic AI voiceovers for your scripts.', 4),
  ('thumbnail-downloader', 'Thumbnail Downloader', 'creative', 'Download public video thumbnails.', 1)
on conflict do nothing;

-- ─── Row Level Security ──────────────────────────────────────────
alter table public.ai_models enable row level security;
alter table public.ai_tools enable row level security;
alter table public.ai_generations enable row level security;
alter table public.media_assets enable row level security;
alter table public.ai_tool_favorites enable row level security;

-- ai_models: everyone can read active models
create policy "Anyone can read active models" on public.ai_models
  for select using (is_active = true);

-- ai_tools: everyone can read active tools
create policy "Anyone can read active tools" on public.ai_tools
  for select using (is_active = true);

-- ai_generations: users can only see their workspace's generations
create policy "Users can view workspace generations" on public.ai_generations
  for select using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );
create policy "Users can insert workspace generations" on public.ai_generations
  for insert with check (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );
create policy "Users can update workspace generations" on public.ai_generations
  for update using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );

-- media_assets: similar to generations
create policy "Users can view workspace media" on public.media_assets
  for select using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );
create policy "Users can insert workspace media" on public.media_assets
  for insert with check (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );
create policy "Users can update workspace media" on public.media_assets
  for update using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );
create policy "Users can delete workspace media" on public.media_assets
  for delete using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );

-- ai_tool_favorites
create policy "Users can manage their favorites" on public.ai_tool_favorites
  for all using (user_id = auth.uid());
