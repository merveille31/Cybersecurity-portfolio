// ============================================================
// src/types/database.ts
// Types TypeScript alignés sur le schéma Supabase
// ============================================================

// ------------------------------------------------------------
// Blocs de contenu (colonne `content` jsonb)
// ------------------------------------------------------------

export type TextBlock = {
  type: 'text'
  value: string
}

export type CodeBlock = {
  type: 'code'
  lang: string
  value: string
}

export type ImageBlock = {
  type: 'image'
  url: string
  caption?: string
}

export type AlertLevel = 'info' | 'warning' | 'danger'

export type AlertBlock = {
  type: 'alert'
  level: AlertLevel
  value: string
}

export type ContentBlock = TextBlock | CodeBlock | ImageBlock | AlertBlock

// ------------------------------------------------------------
// Liens du profil
// ------------------------------------------------------------

export type ProfileLinks = {
  github?: string
  linkedin?: string
  rootme?: string
  tryhackme?: string
  hackthebox?: string
  [key: string]: string | undefined
}

export type ProfileSkills = {
  offensif?: string[]
  défensif?: string[]
  réseau?: string[]
  outils?: string[]
  [key: string]: string[] | undefined
}

// ------------------------------------------------------------
// Tables
// ------------------------------------------------------------

export type Profile = {
  id: 1
  full_name: string
  headline: string
  bio: string
  location: string
  avatar_url: string
  cv_url: string
  email_public: string
  links: ProfileLinks
  skills: ProfileSkills
  updated_at: string
}

export type Project = {
  id: number
  slug: string
  title: string
  summary: string
  content: ContentBlock[]
  tags: string[]
  cover_url: string
  repo_url: string
  demo_url: string
  featured: boolean
  published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type WriteupCategory =
  | 'web'
  | 'pwn'
  | 'forensics'
  | 'crypto'
  | 'reverse'
  | 'osint'
  | 'réseau'
  | 'autre'

export type WriteupDifficulty = 'facile' | 'moyen' | 'difficile' | 'insane'

export type Writeup = {
  id: number
  slug: string
  title: string
  summary: string
  platform: string
  category: WriteupCategory
  difficulty: WriteupDifficulty
  tags: string[]
  content: ContentBlock[]
  cover_url: string
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export type CertificationStatus = 'obtenue' | 'en_cours'

export type Certification = {
  id: number
  name: string
  issuer: string
  status: CertificationStatus
  obtained_at: string | null
  credential_url: string
  sort_order: number
}

export type Message = {
  id: number
  name: string
  email: string
  subject: string
  body: string
  read: boolean
  ip_hash: string | null
  created_at: string
}

// Payload pour l'insertion publique (sans `read` ni `id`)
export type MessageInsert = Pick<Message, 'name' | 'email' | 'subject' | 'body'>

// ------------------------------------------------------------
// Type générique de la base (pour le client Supabase typé)
// ------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      profile: {
        Row: Profile
        Insert: Omit<Profile, 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at'>>
      }
      writeups: {
        Row: Writeup
        Insert: Omit<Writeup, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Writeup, 'id' | 'created_at'>>
      }
      certifications: {
        Row: Certification
        Insert: Omit<Certification, 'id'>
        Update: Partial<Omit<Certification, 'id'>>
      }
      messages: {
        Row: Message
        Insert: MessageInsert
        Update: Pick<Message, 'read'>
      }
    }
  }
}
