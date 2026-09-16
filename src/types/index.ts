export type { Database } from './database.types';

// ─── Auth ─────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  role: 'user' | 'admin';
  credits_remaining: number;
  default_workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Workspace ────────────────────────────────────────────────────
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
  plan: string;
  status: 'active' | 'suspended' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'member' | 'viewer';
  created_at: string;
  profile?: UserProfile;
}

export type WorkspaceRole = WorkspaceMember['role'];

// ─── Subscription & Plans ─────────────────────────────────────────
export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  credits_limit: number;
  max_projects: number;
  max_team_members: number;
  stripe_price_monthly: string | null;
  stripe_price_yearly: string | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  workspace_id: string;
  plan_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  credits_limit: number;
  credits_used: number;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan?: Plan;
}

// ─── Content ──────────────────────────────────────────────────────
export type ContentStatus =
  | 'draft' | 'generating' | 'generated' | 'editing'
  | 'approved' | 'scheduled' | 'publishing' | 'published'
  | 'failed' | 'archived';

export interface Content {
  id: string;
  workspace_id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  type: string;
  status: ContentStatus;
  body: string | null;
  word_count: number;
  seo_score: number | null;
  readability_score: number | null;
  meta_title: string | null;
  meta_description: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  primary_keyword?: string | null;
  secondary_keywords?: string[];
  excerpt?: string | null;
  reading_time?: number;
  character_count?: number;
  published_at?: string | null;
  slug: string | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  project?: Project;
}

export interface ContentVersion {
  id: string;
  content_id: string;
  user_id: string;
  body: string;
  word_count: number;
  version_number: number;
  created_at: string;
}

// ─── Generation ───────────────────────────────────────────────────
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AIProvider = 'openai' | 'gemini' | 'anthropic';

export interface Generation {
  id: string;
  workspace_id: string;
  user_id: string;
  content_id: string | null;
  type: string;
  provider: AIProvider;
  model: string;
  prompt_version: string;
  input_tokens: number | null;
  output_tokens: number | null;
  credits_used: number;
  status: GenerationStatus;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface BatchGeneration {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_items: number;
  completed_items: number;
  failed_items: number;
  credits_reserved: number;
  credits_used: number;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

// ─── Projects ─────────────────────────────────────────────────────
export interface Project {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain: string | null;
  default_tone: string | null;
  default_language: string;
  brand_voice_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  content_count?: number;
}

// ─── Brand Voice ──────────────────────────────────────────────────
export interface BrandVoice {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  tone: string | null;
  audience: string | null;
  do_rules: string | null;
  dont_rules: string | null;
  sample_text: string | null;
  preferred_phrases: string | null;
  forbidden_phrases: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Templates ────────────────────────────────────────────────────
export interface Template {
  id: string;
  workspace_id: string | null;
  user_id: string | null;
  name: string;
  description: string | null;
  category: string;
  content: string;
  variables: Record<string, string>;
  is_public: boolean;
  is_favorite: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
}

// ─── SEO ──────────────────────────────────────────────────────────
export interface Keyword {
  id: string;
  workspace_id: string;
  user_id: string;
  keyword: string;
  country: string | null;
  language: string | null;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  intent: string | null;
  created_at: string;
}

export interface KeywordCluster {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  primary_keyword: string;
  keywords: string[];
  intent: string | null;
  priority: number;
  created_at: string;
}

// ─── Affiliate ────────────────────────────────────────────────────
export interface AffiliateLink {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  slug: string;
  destination_url: string;
  affiliate_url: string;
  campaign_id: string | null;
  product_id: string | null;
  notes: string | null;
  click_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AffiliateProduct {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  url: string | null;
  affiliate_url: string | null;
  category: string | null;
  description: string | null;
  price: number | null;
  commission_rate: number | null;
  created_at: string;
}

export interface AffiliateCampaign {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Automation {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger: string;
  steps: Record<string, unknown>[];
  enabled: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Integrations ─────────────────────────────────────────────────
export type IntegrationType = 'wordpress' | 'blogger' | 'webhook' | 'api';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'needs_reauth';

export interface Integration {
  id: string;
  workspace_id: string;
  user_id: string;
  type: IntegrationType;
  name: string;
  config: Record<string, unknown>;
  status: IntegrationStatus;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Notifications ────────────────────────────────────────────────
export interface Notification {
  id: string;
  workspace_id: string | null;
  user_id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

// ─── API Response ─────────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Generation Request ───────────────────────────────────────────
export interface GenerationRequest {
  type: string;
  topic: string;
  keyword?: string;
  secondaryKeywords?: string[];
  tone?: string;
  language?: string;
  audience?: string;
  length?: 'short' | 'medium' | 'long';
  brandVoiceId?: string;
  projectId?: string;
  instructions?: string;
  affiliateUrl?: string;
  contentId?: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────
export interface DashboardStats {
  totalProjects: number;
  totalContent: number;
  wordsGenerated: number;
  creditsRemaining: number;
  articlesPublished: number;
  affiliateClicks: number;
  recentGenerations: Generation[];
  recentContent: Content[];
  usageByDay: { date: string; credits: number; generations: number }[];
}

export interface DashboardMetrics {
  credits_remaining: number;
  credits_used: number;
  credits_limit: number;
  content_created: number;
  words_generated: number;
  published_articles: number;
  affiliate_clicks: number;
  daily_credit_usage: { date: string; credits: number; generations: number }[];
  recent_content: Array<{ id: string; title: string; type: string; status: string; word_count: number; created_at: string; updated_at?: string; published_at?: string | null }>;
  recent_generations: Array<{ id: string; tool_id: string; model: string; status: string; credits_used: number; created_at: string }>;
}

export interface SearchResult {
  contents: Array<{ id: string; title: string; type: string; status: string; created_at: string }>;
  projects: Array<{ id: string; name: string; description: string | null; created_at: string }>;
  templates: Array<{ id: string; name: string; category: string; description: string | null }>;
  keywords: Array<{ id: string; keyword: string; intent: string | null; volume: number | null; difficulty: number | null }>;
}

