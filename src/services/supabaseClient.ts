import { createClient } from '@supabase/supabase-js'

function normalizeEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined
  return trimmed
}

function normalizeSupabaseUrl(value: string | undefined): string | undefined {
  const trimmed = normalizeEnvValue(value)
  if (!trimmed) return undefined

  try {
    const parsed = new URL(trimmed)
    if (!['http:', 'https:'].includes(parsed.protocol)) return undefined

    const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
    const looksLikeSupabase = parsed.hostname.includes('supabase')
    if (import.meta.env.PROD && (isLocal || parsed.hostname.includes('vercel.app') || !looksLikeSupabase)) {
      console.warn('[FeedbackWall] Suspicious VITE_SUPABASE_URL in production', {
        hostname: parsed.hostname,
      })
    }

    return parsed.origin
  } catch {
    console.error('[FeedbackWall] Invalid VITE_SUPABASE_URL', { value: trimmed })
    return undefined
  }
}

function describePayload(body: BodyInit | null | undefined): {
  payloadType: 'none' | 'JSON' | 'FormData' | 'Blob' | 'URLSearchParams' | 'string' | 'other'
  hasScreenshots: boolean
} {
  if (!body) return { payloadType: 'none', hasScreenshots: false }
  if (body instanceof FormData) {
    let hasScreenshots = false
    for (const [, value] of body.entries()) {
      if (value instanceof Blob) {
        hasScreenshots = true
        break
      }
    }
    return { payloadType: 'FormData', hasScreenshots }
  }
  if (body instanceof Blob) return { payloadType: 'Blob', hasScreenshots: true }
  if (body instanceof URLSearchParams) return { payloadType: 'URLSearchParams', hasScreenshots: false }
  if (typeof body === 'string') {
    const trimmed = body.trim()
    return {
      payloadType: trimmed.startsWith('{') || trimmed.startsWith('[') ? 'JSON' : 'string',
      hasScreenshots: false,
    }
  }
  return { payloadType: 'other', hasScreenshots: false }
}

async function diagnosticFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const endpointUrl =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
  const payload = describePayload(init?.body)
  const isStorageUpload = endpointUrl.includes('/storage/v1/object')
  const hasScreenshots = payload.hasScreenshots || isStorageUpload

  console.log('[FeedbackWall] fetch', {
    endpointUrl,
    method,
    payloadType: payload.payloadType,
    hasScreenshots,
  })

  try {
    return await fetch(input, init)
  } catch (error) {
    console.error('[FeedbackWall] fetch failed', {
      endpointUrl,
      method,
      payloadType: payload.payloadType,
      hasScreenshots,
      error,
    })
    throw error
  }
}

export const supabaseProjectUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY)

/** True once both env vars are usable - the app uses Supabase instead of localStorage. */
export const isSupabaseConfigured = Boolean(supabaseProjectUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseProjectUrl as string, supabaseAnonKey as string, {
      global: { fetch: diagnosticFetch },
    })
  : null
