import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const tables = [
    'profiles', 'workspaces', 'workspace_members', 'plans', 'subscriptions',
    'credit_balances', 'credit_transactions', 'projects', 'contents',
    'content_versions', 'templates', 'brand_voices', 'ai_generations',
    'keywords', 'keyword_clusters', 'competitor_analyses', 'automations',
    'automation_runs', 'integrations', 'affiliate_links', 'affiliate_clicks',
    'notifications', 'support_tickets', 'ticket_messages', 'settings'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.log(`Table ${table} error:`, error.message);
    } else {
      console.log(`Table ${table} OK`);
    }
  }
}

test();
