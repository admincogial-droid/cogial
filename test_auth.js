import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const email = 'test' + Date.now() + '@example.com';
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123'
  });
  
  if (authError) {
    console.log('Auth error:', authError);
    return;
  }
  
  console.log('User created:', authData.user.id);
  
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*');
    
  console.log('workspace_members error:', error);
  console.log('workspace_members data:', data);
}
test();
