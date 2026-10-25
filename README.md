# Portfolio Carelle · Cybersécurité

Portfolio personnel orienté cybersécurité : projets, write-ups de CTF, certifications et formulaire de contact.

En ligne : https://carelle-merveille.vercel.app

## Stack

- **Front** : React 19, TypeScript, Vite, styled-components, framer-motion, react-router
- **Données** : Supabase (PostgreSQL + RLS + Storage)
- **Serveur** : fonction Vercel `api/contact.ts` (formulaire de contact)
- **Hébergement** : Vercel

## Structure

```
api/                    Fonctions serveur Vercel (clés secrètes uniquement ici)
  contact.ts            Réception des messages : validation, anti-spam, rate-limit
src/
  components/           Navbar, Footer, Terminal, BlockRenderer, ErrorBoundary…
  pages/                Accueil, Projets, Write-ups, À propos, Contact, Admin, 404
  lib/                  Client Supabase et requêtes
  styles/               Thème et styles globaux
  types/database.ts     Types alignés sur le schéma SQL
supabase/
  migrations/           Schéma SQL, à exécuter dans l'ordre
  seed.sql              Données d'exemple
vercel.json             Redirige toutes les routes (sauf /api) vers l'application
```

## Installation locale

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev
```

Autres commandes : `npm run build`, `npm run lint`, `npm run preview`.

## Base de données Supabase

Dans l'éditeur SQL de Supabase, exécuter dans cet ordre :

1. `supabase/migrations/001_init.sql`: tables, RLS, bucket `media`
2. `supabase/migrations/002_profile_skills.sql`: compétences du profil
3. `supabase/migrations/003_contact_server_only.sql`: messages insérables uniquement par le serveur
4. `supabase/seed.sql`: données d'exemple (facultatif)

Le contenu (profil, projets, write-ups) est rédigé sous forme de blocs JSON :
`text` (markdown), `code`, `image`, `alert`.

### Devenir administratrice

1. Supabase → **Authentication → Users → Add user** (e-mail + mot de passe).
2. Copier l'identifiant (`UID`) de l'utilisateur créé.
3. Dans l'éditeur SQL :

```sql
insert into public.admins (user_id) values ('UID-ICI');
```

## Variables d'environnement

À définir dans `.env.local` en local et dans **Vercel → Settings → Environment Variables** en production.

| Variable | Où | Rôle |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | navigateur + serveur | URL du projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | navigateur | Clé publique (protégée par la RLS) |
| `SUPABASE_SECRET_KEY` | serveur uniquement | Clé service_role, **jamais** préfixée `VITE_` |
| `IP_HASH_SALT` | serveur uniquement | Sel pour hacher les IP du formulaire de contact |
| `HF_TOKEN`, `HF_MODEL` | serveur uniquement | Réservées au futur assistant IA |

Après une modification des variables sur Vercel, il faut redéployer.
