-- ============================================================
-- 003_contact_server_only.sql
-- Sécurise la table messages : insertion via fonction serveur uniquement
-- ============================================================

-- 1. Colonne ip_hash (SHA-256 de l'IP + sel, jamais l'IP en clair)
alter table public.messages
  add column if not exists ip_hash text;

-- 2. Index pour le rate-limiting (compter les messages récents par ip_hash)
create index if not exists idx_messages_ip_hash_created_at
  on public.messages (ip_hash, created_at);

-- 3. Supprime la policy d'insertion publique (anon)
--    L'insertion se fait désormais uniquement via la clé service_role
--    depuis la fonction serveur Vercel, qui contourne la RLS.
drop policy if exists "messages_insert_anon" on public.messages;

-- Résultat : aucune policy INSERT sur messages
-- → anon et authenticated ne peuvent plus insérer via l'API REST/client
-- → seul service_role (fonction serveur) peut insérer
