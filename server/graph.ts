export const GRAPH_VERSION = 'v21.0'
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`

interface GraphError {
  error?: { message?: string; type?: string; code?: number; error_subcode?: number }
}

export function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}

export function absolutize(relOrAbsUrl: string): string {
  if (/^https?:\/\//i.test(relOrAbsUrl)) return relOrAbsUrl
  const base = process.env.PUBLIC_BASE_URL
  if (!base) {
    throw new Error(
      'PUBLIC_BASE_URL is not set. Instagram/Facebook need a public HTTPS URL for media — deploy the app (e.g. to Railway) and set PUBLIC_BASE_URL to that domain, or expose the dev server via ngrok.',
    )
  }
  if (!/^https:\/\//i.test(base)) {
    throw new Error(`PUBLIC_BASE_URL must be https:// (got: ${base}). Instagram/Facebook reject http.`)
  }
  const trimmedBase = base.replace(/\/+$/, '')
  const path = relOrAbsUrl.startsWith('/') ? relOrAbsUrl : `/${relOrAbsUrl}`
  return `${trimmedBase}${path}`
}

export async function graphFetch(
  endpoint: string,
  init: {
    method: 'GET' | 'POST'
    token: string
    params?: Record<string, string | undefined>
    body?: Record<string, string | undefined>
  },
): Promise<any> {
  const url = new URL(`${GRAPH_BASE}${endpoint}`)
  if (init.method === 'GET') {
    url.searchParams.set('access_token', init.token)
    for (const [k, v] of Object.entries(init.params ?? {})) {
      if (v !== undefined) url.searchParams.set(k, v)
    }
    const res = await fetch(url.toString())
    const json = (await res.json()) as GraphError & Record<string, any>
    if (!res.ok || json.error) {
      throw new Error(json.error?.message || `Graph API ${res.status}`)
    }
    return json
  }
  const form = new URLSearchParams()
  form.set('access_token', init.token)
  for (const [k, v] of Object.entries(init.body ?? {})) {
    if (v !== undefined) form.set(k, v)
  }
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  const json = (await res.json()) as GraphError & Record<string, any>
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Graph API ${res.status}`)
  }
  return json
}
