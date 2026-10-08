-- PressLine Migration 008: Paddle Billing & Ticket Messages Support

-- ─── 1. BILLING HISTORY TABLE ─────────────────────────────────────
create table if not exists public.billing_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  paddle_transaction_id text,
  paddle_invoice_id text,
  plan_name text not null,
  plan_slug text not null,
  billing_cycle text not null default 'monthly', -- 'monthly' or 'yearly'
  amount numeric(10, 2) not null,
  currency text not null default 'USD',
  status text not null default 'paid', -- 'paid', 'pending', 'refunded'
  billing_period_start timestamptz not null default now(),
  billing_period_end timestamptz not null default (now() + interval '30 days'),
  receipt_number text not null,
  payment_method text not null default 'Card / Paddle',
  receipt_url text,
  invoice_pdf_url text,
  credits_awarded int not null default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_history_ws on public.billing_history(workspace_id, created_at desc);

alter table public.billing_history enable row level security;

create policy "billing_history_select" on public.billing_history
  for select using (
    public.is_workspace_member(workspace_id)
  );

create policy "billing_history_insert" on public.billing_history
  for insert with check (
    public.is_workspace_member(workspace_id)
  );

-- ─── 2. TICKET MESSAGES TABLE ─────────────────────────────────────
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ticket_messages_ticket on public.ticket_messages(ticket_id, created_at asc);

alter table public.ticket_messages enable row level security;

create policy "ticket_messages_select" on public.ticket_messages
  for select using (
    exists (
      select 1 from public.support_tickets st
      where st.id = ticket_messages.ticket_id
      and public.is_workspace_member(st.workspace_id)
    )
  );

create policy "ticket_messages_insert" on public.ticket_messages
  for insert with check (
    exists (
      select 1 from public.support_tickets st
      where st.id = ticket_messages.ticket_id
      and public.is_workspace_member(st.workspace_id)
    )
  );
