-- FISU Official Website database setup
-- Run this in Supabase SQL Editor after creating your first admin in Authentication > Users.
-- Safe to run once on a new FISU project. Do not put service_role keys in the website.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin','admin','editor'))
);

alter table public.user_roles enable row level security;

drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role"
on public.user_roles for select to authenticated
using (auth.uid() = user_id);

create or replace function public.fisu_has_content_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('super_admin','admin','editor')
  );
$$;

revoke all on function public.fisu_has_content_role() from public;
grant execute on function public.fisu_has_content_role() to anon, authenticated;

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('news','leadership','projects','resources')),
  title text not null,
  body text not null,
  image_url text,
  link_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "Public can read published FISU content" on public.site_content;
create policy "Public can read published FISU content"
on public.site_content for select
to anon, authenticated
using (published = true or public.fisu_has_content_role());

drop policy if exists "FISU admins can insert content" on public.site_content;
create policy "FISU admins can insert content"
on public.site_content for insert
to authenticated
with check (public.fisu_has_content_role());

drop policy if exists "FISU admins can update content" on public.site_content;
create policy "FISU admins can update content"
on public.site_content for update
to authenticated
using (public.fisu_has_content_role())
with check (public.fisu_has_content_role());

drop policy if exists "FISU admins can delete content" on public.site_content;
create policy "FISU admins can delete content"
on public.site_content for delete
to authenticated
using (public.fisu_has_content_role());

grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;
grant select on public.user_roles to authenticated;

-- Assign the first Super Administrator using the existing Auth account:
insert into public.user_roles (user_id, role)
select id, 'super_admin'
from auth.users
where lower(email) = lower('ifakistudentunion61@gmail.com')
on conflict (user_id) do update set role = 'super_admin';

-- Confirm assignment:
select u.email, r.role
from auth.users u
join public.user_roles r on r.user_id = u.id
where lower(u.email) = lower('ifakistudentunion61@gmail.com');
