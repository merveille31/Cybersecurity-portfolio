/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  // Les variables sans préfixe VITE_ (SUPABASE_SECRET_KEY, IP_HASH_SALT,
  // HF_TOKEN, HF_MODEL) sont réservées à api/ et ne doivent jamais
  // apparaître ici ni dans src/.
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
