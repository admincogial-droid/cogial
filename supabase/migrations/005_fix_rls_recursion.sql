-- NovaPilot · Fix RLS Infinite Recursion Migration 005
-- Fixes the 500 server error caused by recursive policies on workspace_members

-- 1. Create a helper function to check membership (Bypasses RLS)
create or replace function public.is_workspace_member(check_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 
    from public.workspace_members 
    where workspace_id = check_workspace_id 
      and user_id = auth.uid()
  );
$$;

-- 2. Create a helper function to check admin status (Bypasses RLS)
create or replace function public.is_workspace_admin(check_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 
    from public.workspace_members 
    where workspace_id = check_workspace_id 
      and user_id = auth.uid() 
      and role in ('owner', 'admin')
  );
$$;

-- 3. Replace the recursive policies on workspace_members
drop policy if exists "Members view members" on public.workspace_members;
create policy "Members view members" on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Admins manage members" on public.workspace_members;
create policy "Admins manage members" on public.workspace_members for all
  using (public.is_workspace_admin(workspace_id));

-- 4. Fix workspace_invitations which also had a slightly complex policy
drop policy if exists "Admins manage invitations" on public.workspace_invitations;
create policy "Admins manage invitations" on public.workspace_invitations for all
  using (public.is_workspace_admin(workspace_id));
