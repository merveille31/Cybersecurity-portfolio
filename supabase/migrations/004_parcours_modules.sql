-- ============================================================
-- 004_parcours_modules.sql
-- 1. Table "timeline" : étapes du parcours (formations, expériences…)
--    affichées en frise interactive sur l'accueil.
-- 2. Colonne profile.modules : activation / désactivation des sections
--    du site depuis l'administration.
-- À exécuter une fois dans l'éditeur SQL de Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Parcours
-- ------------------------------------------------------------
create table if not exists public.timeline (
  id           bigint      primary key generated always as identity,
  kind         text        not null default 'formation',
  title        text        not null,
  organization text        not null default '',
  location     text        not null default '',
  start_date   date        not null,
  end_date     date,                       -- null = en cours
  description  text        not null default '',
  tags         text[]      not null default '{}',
  published    boolean     not null default true,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint timeline_kind check (
    kind in ('formation','experience','certification','projet','engagement','autre')
  ),
  constraint timeline_title_length check (char_length(title) between 1 and 200),
  constraint timeline_dates check (end_date is null or end_date >= start_date)
);

drop trigger if exists trg_timeline_updated_at on public.timeline;
create trigger trg_timeline_updated_at
  before update on public.timeline
  for each row execute function set_updated_at();

create index if not exists idx_timeline_start on public.timeline(start_date desc);

alter table public.timeline enable row level security;

drop policy if exists "timeline_select_published" on public.timeline;
create policy "timeline_select_published"
  on public.timeline for select
  using (published = true or is_admin());

drop policy if exists "timeline_insert_admin" on public.timeline;
create policy "timeline_insert_admin"
  on public.timeline for insert
  with check (is_admin());

drop policy if exists "timeline_update_admin" on public.timeline;
create policy "timeline_update_admin"
  on public.timeline for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "timeline_delete_admin" on public.timeline;
create policy "timeline_delete_admin"
  on public.timeline for delete
  using (is_admin());

-- ------------------------------------------------------------
-- 2. Modules activables
--    { "assistant": true, "terminal": false, "social_github": false, … }
--    Une clé absente = module activé.
-- ------------------------------------------------------------
alter table public.profile
  add column if not exists modules jsonb not null default '{}';

comment on column public.profile.modules is
  'Sections activées/désactivées depuis l''admin. Clé absente = activé.';

-- ------------------------------------------------------------
-- 3. Exemple de parcours (à remplacer depuis l'admin)
-- ------------------------------------------------------------
insert into public.timeline (kind, title, organization, location, start_date, end_date, description, tags, sort_order)
select * from (values
  ('formation', 'Master Cybersécurité', 'Université (à compléter)', 'France', date '2025-09-01', null::date,
   'Sécurité offensive et défensive, réseaux, cryptographie appliquée.', array['pentest','réseau','crypto'], 0),
  ('experience', 'Stage analyste SOC', 'Entreprise (à compléter)', 'France', date '2025-04-01', date '2025-08-31',
   'Analyse d''alertes, rédaction de règles de détection, réponse à incident.', array['SIEM','détection'], 0),
  ('formation', 'Licence Informatique', 'Université (à compléter)', 'France', date '2022-09-01', date '2025-06-30',
   'Bases en programmation, systèmes et réseaux.', array['python','linux'], 0)
) as v(kind, title, organization, location, start_date, end_date, description, tags, sort_order)
where not exists (select 1 from public.timeline);
