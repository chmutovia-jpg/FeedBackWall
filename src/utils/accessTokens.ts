/** Lowercase, hyphenated, URL-safe slug from a project name. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/** A short random suffix keeps slugs unique even when names collide. */
export function generatePublicSlug(name: string): string {
  const base = slugify(name) || 'project'
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base}-${suffix}`
}

/** Raw owner token shown once to the maker — never persisted in plaintext. */
export function generateOwnerToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * SHA-256 hex digest, computed the same way Postgres's `digest(text, 'sha256')`
 * + `encode(..., 'hex')` does — must stay in sync with hash_owner_token() in
 * supabase/schema.sql so a client-hashed token matches the server-verified one.
 */
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('')
}
