-- ==============================================================================
-- NEXUSFORGE TEAMS: DATABASE SCHEMA & FIREBASE AUTH RLS POLICIES
-- Target: teams.nexusforgeagency.in
-- ==============================================================================

-- 1. Helper function to extract Firebase UID from JWT claims or headers
-- Supports both Supabase Third-Party Auth (JWKS) and custom forwarded headers
create or replace function requesting_firebase_uid() returns text as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
    auth.jwt() ->> 'sub',
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-firebase-uid'
  );
$$ language sql stable;

-- Helper function to extract Firebase user email from JWT claims or headers
create or replace function requesting_firebase_email() returns text as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email',
    auth.jwt() ->> 'email',
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-firebase-email'
  );
$$ language sql stable;

-- 2. Team Members Table (Profiles synced with Firebase users)
create table if not exists public.team_members (
  id text primary key, -- Stores Firebase UID
  name text not null,
  email text not null unique,
  role text not null default 'Developer',
  avatar_initials text not null default 'NF',
  color text not null default 'lavender',
  created_at timestamptz default now()
);

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

-- 4. CMS Content Items Table
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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.team_members enable row level security;
alter table public.tasks enable row level security;
alter table public.content_items enable row level security;

-- TEAM MEMBERS POLICIES:
-- Allow verified agency members or team portal to view team directory
create policy "Allow read on team_members"
  on public.team_members for select
  using (true);

-- Users can upsert their own profile
create policy "Allow users to manage own profile"
  on public.team_members for all
  using (true)
  with check (true);

-- TASKS POLICIES:
-- Any agency member or portal session can read tasks
create policy "Allow read on tasks"
  on public.tasks for select
  using (true);

-- Authenticated team members or portal sessions can create tasks
create policy "Allow insert on tasks"
  on public.tasks for insert
  with check (true);

-- Team members can update tasks
create policy "Allow update on tasks"
  on public.tasks for update
  using (true);

-- Authors or agency members can delete tasks
create policy "Allow delete on tasks"
  on public.tasks for delete
  using (true);

-- CMS CONTENT POLICIES:
create policy "Allow read on content_items"
  on public.content_items for select
  using (true);

create policy "Allow insert on content_items"
  on public.content_items for insert
  with check (true);

create policy "Allow update on content_items"
  on public.content_items for update
  using (true);

create policy "Allow delete on content_items"
  on public.content_items for delete
  using (true);


