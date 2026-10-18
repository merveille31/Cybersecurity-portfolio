-- ============================================================
-- seed.sql
-- Données d'exemple — à exécuter APRÈS 001_init.sql
-- ============================================================

-- ------------------------------------------------------------
-- Profil
-- ------------------------------------------------------------
insert into public.profile (
  id, full_name, headline, bio, location,
  avatar_url, cv_url, email_public, links
) values (
  1,
  'Carelle',
  'Étudiante en cybersécurité · CTF player',
  'Passionnée par la sécurité offensive et défensive. Je participe à des CTF, j''explore les vulnérabilités web et j''aime partager mes apprentissages via des write-ups.',
  'France',
  'https://example.com/avatar.jpg',
  'https://example.com/cv.pdf',
  'contact@example.com',
  '{
    "github":    "https://github.com/carelle",
    "linkedin":  "https://linkedin.com/in/carelle",
    "rootme":    "https://www.root-me.org/carelle",
    "tryhackme": "https://tryhackme.com/p/carelle",
    "hackthebox": "https://app.hackthebox.com/profile/carelle"
  }'::jsonb
)
on conflict (id) do update set
  full_name    = excluded.full_name,
  headline     = excluded.headline,
  bio          = excluded.bio,
  location     = excluded.location,
  avatar_url   = excluded.avatar_url,
  cv_url       = excluded.cv_url,
  email_public = excluded.email_public,
  links        = excluded.links,
  updated_at   = now();

-- ------------------------------------------------------------
-- Projets
-- ------------------------------------------------------------
insert into public.projects (slug, title, summary, content, tags, featured, published, sort_order)
values
(
  'scanner-reseau',
  'Scanner réseau Python',
  'Outil de découverte d''hôtes et de ports sur un réseau local.',
  '[
    {"type":"text","value":"Ce projet est un scanner réseau minimaliste écrit en Python, utilisant des sockets bruts pour détecter les hôtes actifs et les ports ouverts."},
    {"type":"code","lang":"python","value":"import socket\n\ndef scan_port(host, port):\n    with socket.socket() as s:\n        s.settimeout(0.5)\n        return s.connect_ex((host, port)) == 0"},
    {"type":"alert","level":"warning","value":"À utiliser uniquement sur des réseaux dont vous êtes propriétaire ou pour lesquels vous avez une autorisation explicite."}
  ]'::jsonb,
  array['python','réseau','sécurité'],
  true,
  true,
  1
),
(
  'dashboard-ctf',
  'Dashboard CTF',
  'Interface web pour suivre sa progression sur les plateformes CTF.',
  '[
    {"type":"text","value":"Un tableau de bord personnel qui agrège les scores et les challenges résolus depuis plusieurs plateformes CTF via leurs API publiques."},
    {"type":"image","url":"https://example.com/dashboard-preview.png","caption":"Aperçu du tableau de bord"},
    {"type":"alert","level":"info","value":"Le projet est open-source, les contributions sont les bienvenues."}
  ]'::jsonb,
  array['react','typescript','api'],
  false,
  true,
  2
);

-- ------------------------------------------------------------
-- Write-ups
-- ------------------------------------------------------------
insert into public.writeups (slug, title, summary, platform, category, difficulty, tags, content, published, published_at)
values
(
  'thm-simple-ctf',
  'TryHackMe — Simple CTF',
  'Machine débutant couvrant l''énumération, une injection SQL et une escalade de privilèges basique.',
  'TryHackMe',
  'web',
  'facile',
  array['sqli','privesc','enumeration'],
  '[
    {"type":"text","value":"## Reconnaissance\n\nOn commence par un scan Nmap pour identifier les services exposés."},
    {"type":"code","lang":"bash","value":"nmap -sV -sC -oN scan.txt 10.10.x.x"},
    {"type":"text","value":"Le port 80 expose une application CMS vulnérable à une injection SQL dans le paramètre `id`."},
    {"type":"alert","level":"info","value":"Toujours noter les numéros de version des services : ils orientent directement la recherche de CVE."}
  ]'::jsonb,
  true,
  now()
),
(
  'htb-lame',
  'HackTheBox — Lame',
  'Machine classique exploitant une vulnérabilité Samba pour obtenir un accès root direct.',
  'HackTheBox',
  'pwn',
  'facile',
  array['samba','metasploit','cve'],
  '[
    {"type":"text","value":"## Énumération\n\nLame est l''une des premières machines HackTheBox. Le service Samba 3.0.20 est vulnérable à CVE-2007-2447."},
    {"type":"code","lang":"bash","value":"msfconsole -q\nuse exploit/multi/samba/usermap_script\nset RHOSTS 10.10.10.3\nrun"},
    {"type":"alert","level":"danger","value":"N''utilisez jamais Metasploit sur des systèmes sans autorisation écrite préalable."}
  ]'::jsonb,
  true,
  now()
),
-- Write-up non publié pour tester la RLS
(
  'htb-secret-wip',
  'HackTheBox — [WIP] Machine secrète',
  'Write-up en cours de rédaction, non visible publiquement.',
  'HackTheBox',
  'reverse',
  'difficile',
  array['reverse','wip'],
  '[
    {"type":"text","value":"Travail en cours — ne pas publier."}
  ]'::jsonb,
  false,
  null
);

-- ------------------------------------------------------------
-- Certifications
-- ------------------------------------------------------------
insert into public.certifications (name, issuer, status, obtained_at, credential_url, sort_order)
values
(
  'Google Cybersecurity Certificate',
  'Google / Coursera',
  'obtenue',
  '2024-06-15',
  'https://coursera.org/verify/example',
  1
),
(
  'CompTIA Security+',
  'CompTIA',
  'en_cours',
  null,
  '',
  2
);
