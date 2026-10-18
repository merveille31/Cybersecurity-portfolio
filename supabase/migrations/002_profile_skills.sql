-- ============================================================
-- 002_profile_skills.sql
-- Ajoute la colonne skills (jsonb) à la table profile
-- ============================================================

alter table public.profile
  add column if not exists skills jsonb not null default '{}';

comment on column public.profile.skills is
  'Groupes de compétences : { offensif: string[], défensif: string[], réseau: string[], outils: string[] }';
