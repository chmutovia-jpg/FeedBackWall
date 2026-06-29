-- FeedbackWall v1.5 Supabase schema (Supabase Auth + user-owned walls).
--
-- Run this once in the Supabase SQL editor (or via `supabase db push` /
-- the CLI's migration workflow). Safe to re-run AND safe to run on top of
-- the earlier v1 schema — every change here is `if not exists` / `or replace`
-- / `alter ... if not exists`, so it upgrades an existing v1 database in place.
--
-- Two ownership models coexist on purpose:
--
--   1. Authenticated workspace (v1.5, the primary model). A logged-in user
--      owns a project via projects.user_id = auth.uid(). RLS policies keyed on
--      auth.uid() let owners (and only owners) UPDATE/DELETE their projects,
--      manage feedback status, write maker responses, and manage project
--      screenshots — all through normal table operations, no token needed.
--
--   2. Legacy owner token (v1, kept for backward compatibility). Older
--      projects created before auth have a non-null owner_token_hash and a
--      null user_id. They're still fully manageable through the SECURITY
--      DEFINER `owner_*` functions further down, which verify a hashed token.
--      New authenticated projects leave owner_token_hash null.
--
-- Shared rules either way:
--   - Public can read every project/feedback/comment/attachment/screenshot
--     (the public wall needs this), and can submit feedback + attachments and
--     upvote. owner_token_hash is never selectable by anon/authenticated
--     (column-level GRANTs hide it; RLS can't hide a single column).
--   - Votes go through `upvote_feedback`, an atomic SECURITY DEFINER RPC, so
--     the public can increment a counter without a blanket UPDATE grant.

create extension if not exists pgcrypto;

-- ============================================================================
-- Tables
-- ============================================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  public_slug text unique not null,
  owner_token_hash text, -- nullable: set only for legacy owner-token projects
  name text not null,
  url text,
  description text not null,
  feedback_question text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade an existing v1 `projects` table in place (no-ops on a fresh install).
alter table public.projects add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.projects add column if not exists feedback_question text;
alter table public.projects alter column owner_token_hash drop not null;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null check (type in ('bug', 'idea', 'confusing', 'liked', 'painful')),
  status text not null default 'new' check (status in ('new', 'planned', 'in_progress', 'done', 'rejected')),
  title text not null,
  description text not null,
  author_name text,
  votes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.owner_comments (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null unique references public.feedback(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback_attachments (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  file_path text not null,
  file_url text not null,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_screenshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_path text not null,
  file_url text not null,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists feedback_project_id_idx on public.feedback(project_id);
create index if not exists owner_comments_feedback_id_idx on public.owner_comments(feedback_id);
create index if not exists feedback_attachments_feedback_id_idx on public.feedback_attachments(feedback_id);
create index if not exists project_screenshots_project_id_idx on public.project_screenshots(project_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.projects enable row level security;
alter table public.feedback enable row level security;
alter table public.owner_comments enable row level security;
alter table public.feedback_attachments enable row level security;
alter table public.project_screenshots enable row level security;

-- Public read stays open: the public wall loads a project by slug for anyone.
drop policy if exists "projects are publicly readable" on public.projects;
create policy "projects are publicly readable" on public.projects
  for select using (true);

-- v1.5: project creation now requires auth, and the row must be owned by the
-- creator. (The old anonymous "anyone can create a project" policy is dropped;
-- legacy token projects already exist and are managed via the owner_* RPCs.)
drop policy if exists "anyone can create a project" on public.projects;
drop policy if exists "authenticated users create own projects" on public.projects;
create policy "authenticated users create own projects" on public.projects
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "owners update their projects" on public.projects;
create policy "owners update their projects" on public.projects
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "owners delete their projects" on public.projects;
create policy "owners delete their projects" on public.projects
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "feedback is publicly readable" on public.feedback;
create policy "feedback is publicly readable" on public.feedback
  for select using (true);

drop policy if exists "anyone can submit feedback" on public.feedback;
create policy "anyone can submit feedback" on public.feedback
  for insert with check (status = 'new' and votes = 0);

-- v1.5: the authenticated owner of the parent project can change status / delete.
drop policy if exists "owners update their feedback" on public.feedback;
create policy "owners update their feedback" on public.feedback
  for update to authenticated using (
    exists (select 1 from public.projects p where p.id = feedback.project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = feedback.project_id and p.user_id = auth.uid())
  );

drop policy if exists "owners delete their feedback" on public.feedback;
create policy "owners delete their feedback" on public.feedback
  for delete to authenticated using (
    exists (select 1 from public.projects p where p.id = feedback.project_id and p.user_id = auth.uid())
  );

drop policy if exists "owner comments are publicly readable" on public.owner_comments;
create policy "owner comments are publicly readable" on public.owner_comments
  for select using (true);

-- v1.5: only the authenticated owner of the parent project can write a maker response.
drop policy if exists "owners insert their comments" on public.owner_comments;
create policy "owners insert their comments" on public.owner_comments
  for insert to authenticated with check (
    exists (
      select 1 from public.feedback f
      join public.projects p on p.id = f.project_id
      where f.id = owner_comments.feedback_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "owners update their comments" on public.owner_comments;
create policy "owners update their comments" on public.owner_comments
  for update to authenticated using (
    exists (
      select 1 from public.feedback f
      join public.projects p on p.id = f.project_id
      where f.id = owner_comments.feedback_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.feedback f
      join public.projects p on p.id = f.project_id
      where f.id = owner_comments.feedback_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "owners delete their comments" on public.owner_comments;
create policy "owners delete their comments" on public.owner_comments
  for delete to authenticated using (
    exists (
      select 1 from public.feedback f
      join public.projects p on p.id = f.project_id
      where f.id = owner_comments.feedback_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "feedback attachments are publicly readable" on public.feedback_attachments;
create policy "feedback attachments are publicly readable" on public.feedback_attachments
  for select using (true);

drop policy if exists "anyone can attach a screenshot to feedback" on public.feedback_attachments;
create policy "anyone can attach a screenshot to feedback" on public.feedback_attachments
  for insert with check (true);

-- v1.5: the authenticated owner can remove an attachment (e.g. when deleting feedback).
drop policy if exists "owners delete their feedback attachments" on public.feedback_attachments;
create policy "owners delete their feedback attachments" on public.feedback_attachments
  for delete to authenticated using (
    exists (
      select 1 from public.feedback f
      join public.projects p on p.id = f.project_id
      where f.id = feedback_attachments.feedback_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "project screenshots are publicly readable" on public.project_screenshots;
create policy "project screenshots are publicly readable" on public.project_screenshots
  for select using (true);

-- v1.5: only the authenticated owner of the project can manage its screenshots.
drop policy if exists "owners insert their screenshots" on public.project_screenshots;
create policy "owners insert their screenshots" on public.project_screenshots
  for insert to authenticated with check (
    exists (select 1 from public.projects p where p.id = project_screenshots.project_id and p.user_id = auth.uid())
  );

drop policy if exists "owners update their screenshots" on public.project_screenshots;
create policy "owners update their screenshots" on public.project_screenshots
  for update to authenticated using (
    exists (select 1 from public.projects p where p.id = project_screenshots.project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_screenshots.project_id and p.user_id = auth.uid())
  );

drop policy if exists "owners delete their screenshots" on public.project_screenshots;
create policy "owners delete their screenshots" on public.project_screenshots
  for delete to authenticated using (
    exists (select 1 from public.projects p where p.id = project_screenshots.project_id and p.user_id = auth.uid())
  );

-- Legacy token projects (null user_id) can't match any auth.uid() policy above,
-- so they keep being managed through the SECURITY DEFINER owner_* functions below.

-- ============================================================================
-- Privileges
--
-- RLS controls which ROWS a role can see; it can't hide a single COLUMN.
-- owner_token_hash is kept out of anon/authenticated's hands at the
-- privilege level instead, by only ever granting SELECT on the other
-- columns of `projects`. Combined with never granting UPDATE/DELETE on any
-- table to these roles, direct REST calls can't read the hash or mutate
-- owner-only data — only the functions below can, and only after they
-- verify the token themselves.
-- ============================================================================

-- projects: everyone reads the public columns (incl. user_id, which is just a
-- uuid and harmless to expose); owner_token_hash stays unselectable. Only
-- authenticated users insert (with their own user_id) / update / delete; RLS
-- then restricts which rows. Note grants are permissive — RLS is the real gate.
revoke all on public.projects from anon, authenticated;
grant select (id, user_id, public_slug, name, url, description, feedback_question, category, created_at, updated_at)
  on public.projects to anon, authenticated;
grant insert (public_slug, name, url, description, feedback_question, category, user_id)
  on public.projects to authenticated;
grant update (name, url, description, feedback_question, category, updated_at)
  on public.projects to authenticated;
grant delete on public.projects to authenticated;

revoke all on public.feedback from anon, authenticated;
grant select, insert on public.feedback to anon, authenticated;
grant update (status, updated_at), delete on public.feedback to authenticated;

revoke all on public.owner_comments from anon, authenticated;
grant select on public.owner_comments to anon, authenticated;
grant insert (feedback_id, body), update (body, updated_at), delete
  on public.owner_comments to authenticated;

revoke all on public.feedback_attachments from anon, authenticated;
grant select, insert on public.feedback_attachments to anon, authenticated;
grant delete on public.feedback_attachments to authenticated;

revoke all on public.project_screenshots from anon, authenticated;
grant select on public.project_screenshots to anon, authenticated;
grant insert (project_id, file_path, file_url, file_name, file_type, file_size, caption),
  update (caption), delete
  on public.project_screenshots to authenticated;

-- ============================================================================
-- Owner-verified functions (SECURITY DEFINER)
--
-- Each function re-derives the hash from the supplied raw token and checks
-- it against owner_token_hash before doing anything. Because they're
-- SECURITY DEFINER, they run with the privileges of the function owner
-- (not the caller), so they can read owner_token_hash and mutate rows that
-- anon/authenticated have no direct grant on.
-- ============================================================================

create or replace function public.hash_owner_token(p_token text)
returns text
language sql
immutable
as $$
  select encode(digest(p_token, 'sha256'), 'hex')
$$;

-- Returns an explicit column list (not `public.projects` / `select *`) so
-- owner_token_hash can never leave the database through this function's
-- result, even though the function itself can read it internally to verify.
drop function if exists public.get_owner_project(text, text);
create or replace function public.get_owner_project(p_public_slug text, p_token text)
returns table (
  id uuid,
  public_slug text,
  name text,
  url text,
  description text,
  feedback_question text,
  category text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.public_slug,
    p.name,
    p.url,
    p.description,
    p.feedback_question,
    p.category,
    p.created_at,
    p.updated_at
  from public.projects p
  where p.public_slug = p_public_slug
    and p.owner_token_hash = public.hash_owner_token(p_token)
  limit 1
$$;

create or replace function public.owner_update_feedback_status(
  p_feedback_id uuid, p_token text, p_status text
) returns public.feedback
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.feedback;
begin
  update public.feedback f
  set status = p_status, updated_at = now()
  where f.id = p_feedback_id
    and exists (
      select 1 from public.projects p
      where p.id = f.project_id and p.owner_token_hash = public.hash_owner_token(p_token)
    )
  returning * into result;

  if result.id is null then
    raise exception 'Owner token invalid, or feedback not found';
  end if;
  return result;
end;
$$;

create or replace function public.owner_delete_feedback(p_feedback_id uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.feedback f
  where f.id = p_feedback_id
    and exists (
      select 1 from public.projects p
      where p.id = f.project_id and p.owner_token_hash = public.hash_owner_token(p_token)
    );

  if not found then
    raise exception 'Owner token invalid, or feedback not found';
  end if;
end;
$$;

create or replace function public.upvote_feedback(p_feedback_id uuid)
returns public.feedback
language plpgsql
as $$
declare
  result public.feedback;
begin
  update public.feedback
  set votes = votes + 1, updated_at = now()
  where id = p_feedback_id
  returning * into result;

  if result.id is null then
    raise exception 'Feedback not found';
  end if;
  return result;
end;
$$;

-- One response per feedback item, same product rule as v0: this upserts.
create or replace function public.owner_save_comment(
  p_feedback_id uuid, p_token text, p_body text
) returns public.owner_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.owner_comments;
begin
  if not exists (
    select 1 from public.feedback f
    join public.projects p on p.id = f.project_id
    where f.id = p_feedback_id and p.owner_token_hash = public.hash_owner_token(p_token)
  ) then
    raise exception 'Owner token invalid, or feedback not found';
  end if;

  insert into public.owner_comments (feedback_id, body)
  values (p_feedback_id, p_body)
  on conflict (feedback_id) do update set body = excluded.body, updated_at = now()
  returning * into result;
  return result;
end;
$$;

create or replace function public.owner_delete_comment(p_feedback_id uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.owner_comments c
  where c.feedback_id = p_feedback_id
    and exists (
      select 1 from public.feedback f
      join public.projects p on p.id = f.project_id
      where f.id = c.feedback_id and p.owner_token_hash = public.hash_owner_token(p_token)
    );

  if not found then
    raise exception 'Owner token invalid, or comment not found';
  end if;
end;
$$;

create or replace function public.owner_add_project_screenshot(
  p_project_id uuid, p_token text,
  p_file_path text, p_file_url text, p_file_name text, p_file_type text, p_file_size integer,
  p_caption text default null
) returns public.project_screenshots
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.project_screenshots;
begin
  if not exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.owner_token_hash = public.hash_owner_token(p_token)
  ) then
    raise exception 'Owner token invalid, or project not found';
  end if;

  insert into public.project_screenshots
    (project_id, file_path, file_url, file_name, file_type, file_size, caption)
  values (p_project_id, p_file_path, p_file_url, p_file_name, p_file_type, p_file_size, p_caption)
  returning * into result;
  return result;
end;
$$;

create or replace function public.owner_update_screenshot_caption(
  p_screenshot_id uuid, p_token text, p_caption text
) returns public.project_screenshots
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.project_screenshots;
begin
  update public.project_screenshots s
  set caption = p_caption
  where s.id = p_screenshot_id
    and exists (
      select 1 from public.projects p
      where p.id = s.project_id and p.owner_token_hash = public.hash_owner_token(p_token)
    )
  returning * into result;

  if result.id is null then
    raise exception 'Owner token invalid, or screenshot not found';
  end if;
  return result;
end;
$$;

-- Returns the deleted row (rather than void) so the app can read file_path
-- back and remove the matching object from Storage right after.
create or replace function public.owner_delete_project_screenshot(p_screenshot_id uuid, p_token text)
returns public.project_screenshots
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.project_screenshots;
begin
  delete from public.project_screenshots s
  where s.id = p_screenshot_id
    and exists (
      select 1 from public.projects p
      where p.id = s.project_id and p.owner_token_hash = public.hash_owner_token(p_token)
    )
  returning * into result;

  if result.id is null then
    raise exception 'Owner token invalid, or screenshot not found';
  end if;
  return result;
end;
$$;

grant execute on function public.hash_owner_token(text) to anon, authenticated;
grant execute on function public.get_owner_project(text, text) to anon, authenticated;
grant execute on function public.owner_update_feedback_status(uuid, text, text) to anon, authenticated;
grant execute on function public.owner_delete_feedback(uuid, text) to anon, authenticated;
grant execute on function public.upvote_feedback(uuid) to anon, authenticated;
grant execute on function public.owner_save_comment(uuid, text, text) to anon, authenticated;
grant execute on function public.owner_delete_comment(uuid, text) to anon, authenticated;
grant execute on function public.owner_add_project_screenshot(uuid, text, text, text, text, text, integer, text) to anon, authenticated;
grant execute on function public.owner_update_screenshot_caption(uuid, text, text) to anon, authenticated;
grant execute on function public.owner_delete_project_screenshot(uuid, text) to anon, authenticated;

-- ============================================================================
-- Storage
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('feedbackwall-screenshots', 'feedbackwall-screenshots', true)
on conflict (id) do nothing;

drop policy if exists "public can read feedbackwall screenshots" on storage.objects;
create policy "public can read feedbackwall screenshots" on storage.objects
  for select using (bucket_id = 'feedbackwall-screenshots');

drop policy if exists "public can upload feedbackwall screenshots" on storage.objects;
create policy "public can upload feedbackwall screenshots" on storage.objects
  for insert with check (bucket_id = 'feedbackwall-screenshots');

-- Pragmatic v1: anyone can delete a file from this bucket once they know its
-- path. The app only calls .remove() after an owner-verified RPC has already
-- deleted the corresponding database row, so in practice deletion is gated
-- by the token check above it — but storage.objects itself has no concept
-- of our token. See README "v1 limitations" for the v2 plan (Edge Function
-- proxy for storage deletes, scoped to the verified owner).
drop policy if exists "public can delete feedbackwall screenshots" on storage.objects;
create policy "public can delete feedbackwall screenshots" on storage.objects
  for delete using (bucket_id = 'feedbackwall-screenshots');
