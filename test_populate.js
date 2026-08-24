import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const email = 'testuser' + Math.floor(Math.random() * 100000) + '@gmail.com';
  console.log('Signing up with', email);
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password12345'
  });
  
  if (authError) {
    console.log('Auth error:', authError);
    return;
  }
  
  const userId = authData.user?.id;
  console.log('User created:', userId);
  
  // Create a workspace
  const { data: wsData, error: wsError } = await supabase
    .from('workspaces')
    .insert({
      name: 'Test Workspace',
      slug: 'test-ws-' + Date.now(),
      owner_id: userId
    }).select().single();
    
  console.log('Workspace creation error:', wsError);
  console.log('Workspace created:', wsData?.id);
  
  // Now query workspace_members
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*');
    
  console.log('workspace_members query error:', error);
  console.log('workspace_members query data:', data);
}

test();
