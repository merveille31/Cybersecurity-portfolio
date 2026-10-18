-- ============================================================
-- 001_init.sql
-- Schéma complet du portfolio Carelle
-- À exécuter en une fois dans l'éditeur SQL de Supabase
-- ============================================================

-- ------------------------------------------------------------
-- 0. Extensions
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. Fonction utilitaire : updated_at trigger
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 2. Fonction is_admin()
--    Vérifie que l'utilisateur connecté est dans la table admins.
--    SECURITY DEFINER + search_path vide pour éviter toute
--    élévation de privilège via search_path hijacking.
-- ------------------------------------------------------------
create or replace function is_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1
    from public.admins
    where user_id = auth.uid()
  );
end;
$$;

-- ------------------------------------------------------------
-- 3. Tables
-- ------------------------------------------------------------

-- 3.1 admins
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- 3.2 profile (une seule ligne, contrainte via RLS + convention)
create table public.profile (
  id          integer primary key default 1 check (id = 1),
  full_name   text        not null default '',
  headline    text        not null default '',
  bio         text        not null default '',
  location    text        not null default '',
  avatar_url  text        not null default '',
  cv_url      text        not null default '',
  email_public text       not null default '',
  links       jsonb       not null default '{}',
  updated_at  timestamptz not null default now()
);

-- 3.3 projects
create table public.projects (
  id          bigint      primary key generated always as identity,
  slug        text        not null unique,
  title       text        not null,
  summary     text        not null default '',
  content     jsonb       not null default '[]',
  tags        text[]      not null default '{}',
  cover_url   text        not null default '',
  repo_url    text        not null default '',
  demo_url    text        not null default '',
  featured    boolean     not null default false,
  published   boolean     not null default false,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

-- 3.4 writeups
create table public.writeups (
  id           bigint      primary key generated always as identity,
  slug         text        not null unique,
  title        text        not null,
  summary      text        not null default '',
  platform     text        not null default '',
  category     text        not null,
  difficulty   text        not null,
  tags         text[]      not null default '{}',
  content      jsonb       not null default '[]',
  cover_url    text        not null default '',
  published    boolean     not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint writeups_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint writeups_category check (
    category in ('web','pwn','forensics','crypto','reverse','osint','réseau','autre')
  ),
  constraint writeups_difficulty check (
    difficulty in ('facile','moyen','difficile','insane')
  )
);

-- 3.5 certifications
create table public.certifications (
  id             bigint      primary key generated always as identity,
  name           text        not null,
  issuer         text        not null default '',
  status         text        not null,
  obtained_at    date,
  credential_url text        not null default '',
  sort_order     integer     not null default 0,

  constraint certifications_status check (
    status in ('obtenue','en_cours')
  )
);

-- 3.6 messages
create table public.messages (
  id         bigint      primary key generated always as identity,
  name       text        not null,
  email      text        not null,
  subject    text        not null,
  body       text        not null,
  read       boolean     not null default false,
  created_at timestamptz not null default now(),

  constraint messages_name_length    check (char_length(name)    between 1 and 100),
  constraint messages_email_length   check (char_length(email)   between 6 and 254),
  constraint messages_email_format   check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint messages_subject_length check (char_length(subject) between 1 and 200),
  constraint messages_body_length    check (char_length(body)    between 1 and 5000)
);

-- ------------------------------------------------------------
-- 4. Triggers updated_at
-- ------------------------------------------------------------
create trigger trg_profile_updated_at
  before update on public.profile
  for each row execute function set_updated_at();

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function set_updated_at();

create trigger trg_writeups_updated_at
  before update on public.writeups
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- 5. Index
-- ------------------------------------------------------------
create index idx_projects_slug      on public.projects(slug);
create index idx_projects_published on public.projects(published);
create index idx_writeups_slug      on public.writeups(slug);
create index idx_writeups_published on public.writeups(published);

-- ------------------------------------------------------------
-- 6. Row Level Security
-- ------------------------------------------------------------

-- 6.1 admins : aucun accès API (ni lecture ni écriture)
alter table public.admins enable row level security;
-- Pas de policy => aucune ligne accessible via l'API REST/client.
-- La gestion se fait uniquement via le dashboard Supabase ou
-- des fonctions SECURITY DEFINER.

-- 6.2 profile
alter table public.profile enable row level security;

create policy "profile_select_public"
  on public.profile for select
  using (true);

create policy "profile_insert_admin"
  on public.profile for insert
  with check (is_admin());

create policy "profile_update_admin"
  on public.profile for update
  using (is_admin())
  with check (is_admin());

create policy "profile_delete_admin"
  on public.profile for delete
  using (is_admin());

-- 6.3 certifications
alter table public.certifications enable row level security;

create policy "certifications_select_public"
  on public.certifications for select
  using (true);

create policy "certifications_insert_admin"
  on public.certifications for insert
  with check (is_admin());

create policy "certifications_update_admin"
  on public.certifications for update
  using (is_admin())
  with check (is_admin());

create policy "certifications_delete_admin"
  on public.certifications for delete
  using (is_admin());

-- 6.4 projects
alter table public.projects enable row level security;

create policy "projects_select_published"
  on public.projects for select
  using (published = true or is_admin());

create policy "projects_insert_admin"
  on public.projects for insert
  with check (is_admin());

create policy "projects_update_admin"
  on public.projects for update
  using (is_admin())
  with check (is_admin());

create policy "projects_delete_admin"
  on public.projects for delete
  using (is_admin());

-- 6.5 writeups
alter table public.writeups enable row level security;

create policy "writeups_select_published"
  on public.writeups for select
  using (published = true or is_admin());

create policy "writeups_insert_admin"
  on public.writeups for insert
  with check (is_admin());

create policy "writeups_update_admin"
  on public.writeups for update
  using (is_admin())
  with check (is_admin());

create policy "writeups_delete_admin"
  on public.writeups for delete
  using (is_admin());

-- 6.6 messages
alter table public.messages enable row level security;

-- Insertion publique : anon peut insérer, mais ne peut pas
-- fixer la valeur de `read` (elle est forcée à false par défaut
-- et la colonne n'est pas exposée en écriture via cette policy).
create policy "messages_insert_anon"
  on public.messages for insert
  with check (read = false);

create policy "messages_select_admin"
  on public.messages for select
  using (is_admin());

create policy "messages_update_admin"
  on public.messages for update
  using (is_admin())
  with check (is_admin());

create policy "messages_delete_admin"
  on public.messages for delete
  using (is_admin());

-- ------------------------------------------------------------
-- 7. Storage : bucket "media"
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880,  -- 5 Mo en octets
  array['image/png','image/jpeg','image/webp','application/pdf']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lecture publique des objets
create policy "media_select_public"
  on storage.objects for select
  using (bucket_id = 'media');

-- Upload réservé aux admins
create policy "media_insert_admin"
  on storage.objects for insert
  with check (bucket_id = 'media' and is_admin());

-- Mise à jour réservée aux admins
create policy "media_update_admin"
  on storage.objects for update
  using (bucket_id = 'media' and is_admin());

-- Suppression réservée aux admins
create policy "media_delete_admin"
  on storage.objects for delete
  using (bucket_id = 'media' and is_admin());
