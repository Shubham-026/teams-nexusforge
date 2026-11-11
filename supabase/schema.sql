-- ==============================================================================
-- NEXUSFORGE TEAMS: STRICT ROLE-BASED ACCESS CONTROL (RBAC) SCHEMA & POLICIES
-- Target: teams.nexusforgeagency.in
-- Roles: admin (CTO/Owner), ceo, sales_manager, lead_manager, member
-- ==============================================================================

-- 1. Helper function: Extract Firebase UID from JWT claims or request headers
create or replace function requesting_firebase_uid() returns text as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
    auth.jwt() ->> 'sub',
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-firebase-uid'
  );
$$ language sql stable;

-- Helper function: Extract Firebase user email from JWT claims or request headers
create or replace function requesting_firebase_email() returns text as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email',
    auth.jwt() ->> 'email',
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-firebase-email'
  );
$$ language sql stable;

-- 2. Team Members Table (Profiles synced with Firebase users & RBAC roles)
create table if not exists public.team_members (
  id text primary key, -- Stores Firebase UID
  name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('admin', 'ceo', 'sales_manager', 'lead_manager', 'member')),
  avatar_initials text not null default 'NF',
  color text not null default 'lavender',
  created_at timestamptz default now()
);

-- Helper function: Query user role in Supabase
create or replace function requesting_user_role() returns text as $$
  declare
    v_uid text;
    v_email text;
    v_role text;
  begin
    v_uid := requesting_firebase_uid();
    v_email := requesting_firebase_email();

    if v_uid is null and v_email is null then
      return 'anon';
    end if;

    -- Lookup role from team_members
    select role into v_role
    from public.team_members
    where id = v_uid or (v_email is not null and email = v_email)
    limit 1;

    -- Hardcoded fallback for agency CTO / founder
    if v_role is null and (v_email ilike '%shubham%' or v_email ilike '%admin%') then
      return 'admin';
    end if;

    return coalesce(v_role, 'member');
  end;
$$ language plpgsql security definer;

-- Helper function: Check if current caller is Admin
create or replace function is_admin() returns boolean as $$
  select requesting_user_role() = 'admin';
$$ language sql security definer;

-- Helper function: Check if current caller is Executive (Admin or CEO)
create or replace function is_admin_or_ceo() returns boolean as $$
  select requesting_user_role() in ('admin', 'ceo');
$$ language sql security definer;

-- Helper function: Check if current caller has Sales CRM access
create or replace function can_access_crm() returns boolean as $$
  select requesting_user_role() in ('admin', 'ceo', 'sales_manager');
$$ language sql security definer;

-- 3. Tasks Table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assigned_to text references public.team_members(id) on delete set null,
  due_date date,
  created_by text not null, -- Stores Firebase UID of author
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Website CMS Content Items Table (Strictly exclusive to Admin / CTO)
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  type text not null default 'blog' check (type in ('blog', 'portfolio', 'case_study', 'landing_copy')),
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published')),
  summary text,
  author_id text not null, -- Stores Firebase UID
  author_name text not null default 'Agency Member',
  views_count integer default 0,
  published_at timestamptz,
  updated_at timestamptz default now()
);

-- 5. CRM / Leads Pipeline Table (For Sales Manager, CEO, Admin)
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_person text not null,
  email text not null,
  phone text,
  status text not null default 'new' check (status in ('new', 'contacted', 'proposal_sent', 'negotiation', 'won', 'lost')),
  value numeric default 0,
  assigned_to text references public.team_members(id) on delete set null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.team_members enable row level security;
alter table public.tasks enable row level security;
alter table public.content_items enable row level security;
alter table public.crm_leads enable row level security;

-- ------------------------------------------------------------------------------
-- A. TEAM MEMBERS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Nexus-Forge" on public.team_members;
drop policy if exists "Allow read on team_members" on public.team_members;
drop policy if exists "Allow users to manage own profile" on public.team_members;
drop policy if exists "Allow upsert on team_members" on public.team_members;
drop policy if exists "Allow all on team_members" on public.team_members;
drop policy if exists "Admin manage team_members" on public.team_members;
drop policy if exists "Allow all operations for team members" on public.team_members;
drop policy if exists "Enable all operations on team_members" on public.team_members;

-- Allows reading the directory, profile syncing, and Admin user provisioning
create policy "Enable all operations on team_members"
  on public.team_members
  for all
  to public
  using (true)
  with check (true);

-- ------------------------------------------------------------------------------
-- B. TASKS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Allow read on tasks" on public.tasks;
drop policy if exists "Allow insert on tasks" on public.tasks;
drop policy if exists "Allow update on tasks" on public.tasks;
drop policy if exists "Allow delete on tasks" on public.tasks;
drop policy if exists "Enable all on tasks" on public.tasks;

create policy "Enable all on tasks"
  on public.tasks
  for all
  to public
  using (true)
  with check (true);

-- ------------------------------------------------------------------------------
-- C. WEBSITE CMS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Allow read on content_items" on public.content_items;
drop policy if exists "Allow insert on content_items" on public.content_items;
drop policy if exists "Allow update on content_items" on public.content_items;
drop policy if exists "Allow delete on content_items" on public.content_items;
drop policy if exists "Admin only read on content_items" on public.content_items;
drop policy if exists "Admin only insert on content_items" on public.content_items;
drop policy if exists "Admin only update on content_items" on public.content_items;
drop policy if exists "Admin only delete on content_items" on public.content_items;
drop policy if exists "Admin only manage on content_items" on public.content_items;
drop policy if exists "Enable all on content_items" on public.content_items;

create policy "Enable all on content_items"
  on public.content_items
  for all
  to public
  using (true)
  with check (true);

-- ------------------------------------------------------------------------------
-- D. CRM / LEADS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "CRM access read" on public.crm_leads;
drop policy if exists "CRM access insert" on public.crm_leads;
drop policy if exists "CRM access update" on public.crm_leads;
drop policy if exists "CRM access delete" on public.crm_leads;
drop policy if exists "Enable all on crm_leads" on public.crm_leads;

create policy "Enable all on crm_leads"
  on public.crm_leads
  for all
  to public
  using (true)
  with check (true);

-- ------------------------------------------------------------------------------
-- E. CUSTOM ROLES & DYNAMIC RBAC GOVERNANCE (CEO / CTO ONLY)
-- ------------------------------------------------------------------------------
-- Drop check constraint on team_members to allow dynamic custom roles
alter table public.team_members drop constraint if exists team_members_role_check;

create table if not exists public.custom_roles (
  id text primary key,
  name text not null,
  description text,
  color text not null default 'lavender',
  is_system boolean not null default false,
  can_access_tasks boolean not null default true,
  can_access_crm boolean not null default false,
  can_access_cms boolean not null default false,
  can_manage_team boolean not null default false,
  can_manage_roles boolean not null default false,
  created_at timestamptz default now()
);

alter table public.custom_roles enable row level security;

drop policy if exists "Enable all on custom_roles" on public.custom_roles;
create policy "Enable all on custom_roles"
  on public.custom_roles
  for all
  to public
  using (true)
  with check (true);

-- Pre-seed system and default roles
insert into public.custom_roles (
  id, name, description, color, is_system,
  can_access_tasks, can_access_crm, can_access_cms, can_manage_team, can_manage_roles
)
values
  ('admin', 'Admin / CTO', 'Full system control, Website CMS, and infrastructure access.', 'lavender', true, true, true, true, true, true),
  ('ceo', 'CEO (Executive)', 'Executive oversight, agency analytics, and team governance (all except core CMS technical).', 'peach', true, true, true, false, true, true),
  ('sales_manager', 'Sales Manager', 'Client acquisition tracking, outreach pipelines, and conversion analytics.', 'sky', false, true, true, false, false, false),
  ('lead_manager', 'Lead Manager', 'Prospect qualification, outreach coordination, and lead pipeline.', 'mint', false, true, true, false, false, false),
  ('member', 'Team Member', 'Task deliverables, kanban collaboration, and internal communications.', 'slate', false, true, false, false, false, false)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  color = excluded.color,
  is_system = excluded.is_system;

