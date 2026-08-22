/**
 * Supabase Database Types
 * Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID` to regenerate.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: string;
          role: 'user' | 'admin';
          credits_remaining: number;
          default_workspace_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>; Relationships: any[];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          logo_url: string | null;
          plan: string;
          status: 'active' | 'suspended' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>; Relationships: any[];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'editor' | 'member' | 'viewer';
          created_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['workspace_members']['Insert']>; Relationships: any[];
      };
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: string;
          token: string;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['workspace_invitations']['Insert']>; Relationships: any[];
      };
      subscriptions: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>; Relationships: any[];
      };
      plans: {
        Row: {
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
          features: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['plans']['Insert']>; Relationships: any[];
      };
      credit_balances: {
        Row: {
          workspace_id: string;
          balance: number;
          updated_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['credit_balances']['Row']>; Relationships: any[];
      };
      credit_transactions: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          type: 'purchase' | 'subscription' | 'generation' | 'refund' | 'bonus' | 'adjustment';
          amount: number;
          balance_after: number;
          reference_type: string | null;
          reference_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['credit_transactions']['Insert']>; Relationships: any[];
      };
      projects: {
        Row: {
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
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>; Relationships: any[];
      };
      brand_voices: {
        Row: {
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
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['brand_voices']['Insert']>; Relationships: any[];
      };
      templates: {
        Row: {
          id: string;
          workspace_id: string | null;
          user_id: string | null;
          name: string;
          description: string | null;
          category: string;
          content: string;
          variables: Json;
          is_public: boolean;
          is_favorite: boolean;
          use_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['templates']['Insert']>; Relationships: any[];
      };
      contents: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          type: string;
          status: 'draft' | 'generating' | 'generated' | 'editing' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'archived';
          body: string | null;
          word_count: number;
          seo_score: number | null;
          readability_score: number | null;
          meta_title: string | null;
          meta_description: string | null;
          slug: string | null;
          tags: string[];
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['contents']['Insert']>; Relationships: any[];
      };
      content_versions: {
        Row: {
          id: string;
          content_id: string;
          user_id: string;
          body: string;
          word_count: number;
          version_number: number;
          created_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['content_versions']['Insert']>; Relationships: any[];
      };
      generations: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          content_id: string | null;
          type: string;
          provider: string;
          model: string;
          prompt_version: string;
          input_tokens: number | null;
          output_tokens: number | null;
          credits_used: number;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['generations']['Insert']>; Relationships: any[];
      };
      batch_generations: {
        Row: {
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
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['batch_generations']['Insert']>; Relationships: any[];
      };
      keywords: {
        Row: {
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
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['keywords']['Insert']>; Relationships: any[];
      };
      keyword_clusters: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          name: string;
          primary_keyword: string;
          keywords: Json;
          intent: string | null;
          priority: number;
          created_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['keyword_clusters']['Insert']>; Relationships: any[];
      };
      competitor_analyses: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          domain: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          result: Json | null;
          error: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['competitor_analyses']['Insert']>; Relationships: any[];
      };
      affiliate_links: {
        Row: {
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
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['affiliate_links']['Insert']>; Relationships: any[];
      };
      affiliate_products: {
        Row: {
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
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['affiliate_products']['Insert']>; Relationships: any[];
      };
      affiliate_campaigns: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['affiliate_campaigns']['Insert']>; Relationships: any[];
      };
      affiliate_clicks: {
        Row: {
          id: string;
          link_id: string;
          user_agent: string | null;
          referrer: string | null;
          country: string | null;
          device: string | null;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['affiliate_clicks']['Insert']>; Relationships: any[];
      };
      automations: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          name: string;
          description: string | null;
          trigger: string;
          steps: Json;
          enabled: boolean;
          run_count: number;
          last_run_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['automations']['Insert']>; Relationships: any[];
      };
      automation_runs: {
        Row: {
          id: string;
          automation_id: string;
          workspace_id: string;
          status: 'pending' | 'running' | 'completed' | 'failed';
          started_at: string;
          completed_at: string | null;
          error: string | null;
          logs: Json;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['automation_runs']['Insert']>; Relationships: any[];
      };
      integrations: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          type: 'wordpress' | 'blogger' | 'webhook' | 'api';
          name: string;
          config: Json;
          status: 'connected' | 'disconnected' | 'error' | 'needs_reauth';
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['integrations']['Insert']>; Relationships: any[];
      };
      publishing_jobs: {
        Row: {
          id: string;
          workspace_id: string;
          content_id: string;
          integration_id: string;
          status: 'pending' | 'processing' | 'published' | 'failed' | 'retrying';
          external_id: string | null;
          external_url: string | null;
          error: string | null;
          scheduled_at: string | null;
          published_at: string | null;
          created_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['publishing_jobs']['Insert']>; Relationships: any[];
      };
      api_keys: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          last_used_at: string | null;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>; Relationships: any[];
      };
      support_tickets: {
        Row: {
          id: string;
          workspace_id: string | null;
          user_id: string;
          subject: string;
          category: string;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          status: 'open' | 'pending' | 'resolved' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['support_tickets']['Insert']>; Relationships: any[];
      };
      support_messages: {
        Row: {
          id: string;
          ticket_id: string;
          user_id: string;
          body: string;
          is_staff: boolean;
          created_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['support_messages']['Insert']>; Relationships: any[];
      };
      notifications: {
        Row: {
          id: string;
          workspace_id: string | null;
          user_id: string;
          type: 'success' | 'info' | 'warning' | 'error';
          title: string;
          body: string | null;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>; Relationships: any[];
      };
      feature_flags: {
        Row: {
          id: string;
          name: string;
          enabled: boolean;
          description: string | null;
          rollout_percent: number;
          updated_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['feature_flags']['Insert']>; Relationships: any[];
      };
      audit_logs: {
        Row: {
          id: string;
          workspace_id: string | null;
          user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>; Relationships: any[];
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          body: string;
          featured_image: string | null;
          status: 'draft' | 'published' | 'scheduled' | 'archived';
          author_id: string;
          category: string | null;
          tags: string[];
          meta_title: string | null;
          meta_description: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: Partial<Database['public']['Tables']['blog_posts']['Insert']>; Relationships: any[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_workspace_credits: {
        Args: { p_workspace_id: string };
        Returns: number;
      };
      deduct_credits: {
        Args: { p_workspace_id: string; p_user_id: string; p_amount: number; p_description: string; p_reference_type: string; p_reference_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
