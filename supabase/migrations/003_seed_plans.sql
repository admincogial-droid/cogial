-- NovaPilot · Seed Plans Migration 003

insert into public.plans (name, slug, description, price_monthly, price_yearly, credits_limit, max_projects, max_team_members, features, sort_order) values
('Free', 'free', 'Try NovaPilot before you upgrade', 0, 0, 100, 3, 1,
  '["5 AI generations/month","Basic content tools","1 project","Community support"]',
  0),
('Starter', 'starter', 'For solo creators getting started with AI content', 19, 190, 500, 10, 1,
  '["500 AI credits/month","All content creation tools","10 projects","WordPress integration","Priority support"]',
  1),
('Pro', 'pro', 'For creators running a real content calendar', 49, 490, 2000, 50, 5,
  '["2,000 AI credits/month","Bulk generation up to 50","SEO optimizer","Keyword clustering","Affiliate tools","5 team seats","Analytics dashboard","API access"]',
  2),
('Business', 'business', 'For agencies and teams shipping at scale', 99, 990, 8000, 200, 20,
  '["8,000 AI credits/month","Bulk generation up to 500","Advanced SEO","Competitor analysis","Full automation","20 team seats","Custom brand voices","Webhook integrations","Dedicated support"]',
  3),
('Enterprise', 'enterprise', 'For large teams and enterprises', 299, 2990, 50000, -1, -1,
  '["50,000 AI credits/month","Unlimited projects","Unlimited team seats","Custom AI models","SSO","SLA support","Custom integrations","Dedicated account manager"]',
  4)
on conflict (slug) do nothing;

-- Seed feature flags
insert into public.feature_flags (name, enabled, description) values
('bulk_generation', true, 'Allow bulk content generation'),
('wordpress', true, 'WordPress publishing integration'),
('blogger', true, 'Blogger publishing integration'),
('affiliate_tracking', true, 'Affiliate link click tracking'),
('advanced_seo', true, 'Advanced SEO tools'),
('team_workspaces', true, 'Multi-user workspace support'),
('api_access', true, 'External API key access'),
('automation', true, 'Content automation workflows'),
('content_versioning', true, 'Content version history'),
('ai_streaming', true, 'Stream AI responses progressively')
on conflict (name) do nothing;
