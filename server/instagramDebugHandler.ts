import type { Request, Response } from 'express'
import { getBusinessAccountId, getBusinessUsername } from './instagram'
import { getFacebookPageId, getFacebookPageName } from './facebook'
import { GRAPH_BASE } from './graph'
import { readRecentPublishErrors } from './publishErrorLog'

interface ProbeResult<T> {
  ok: boolean
  value?: T
  error?: string
}

async function probe<T>(label: string, fn: () => Promise<T>): Promise<ProbeResult<T>> {
  try {
    const value = await fn()
    return { ok: true, value }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `${label}: ${message}` }
  }
}

interface DebugTokenInfo {
  isValid: boolean
  expiresAt: string | null
  scopes: string[]
  appId: string | null
}

async function inspectToken(token: string): Promise<DebugTokenInfo> {
  const url = new URL(`${GRAPH_BASE}/debug_token`)
  url.searchParams.set('input_token', token)
  url.searchParams.set('access_token', token)
  const res = await fetch(url.toString())
  const json = (await res.json()) as {
    data?: {
      is_valid?: boolean
      expires_at?: number
      scopes?: string[]
      app_id?: string
    }
    error?: { message?: string }
  }
  if (json.error) throw new Error(json.error.message ?? 'debug_token failed')
  const d = json.data ?? {}
  return {
    isValid: Boolean(d.is_valid),
    expiresAt: d.expires_at ? new Date(d.expires_at * 1000).toISOString() : null,
    scopes: d.scopes ?? [],
    appId: d.app_id ?? null,
  }
}

export async function getInstagramDebugHandler(_req: Request, res: Response): Promise<void> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN ?? ''
  const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? ''

  const baseChecks = {
    hasToken: token.length > 0,
    hasPublicBaseUrl: publicBaseUrl.length > 0,
    publicBaseUrl: publicBaseUrl || null,
    publicBaseUrlIsHttps: publicBaseUrl.startsWith('https://'),
    nodeEnv: process.env.NODE_ENV ?? null,
  }

  if (!baseChecks.hasToken) {
    res.json({
      ok: false,
      reason: 'INSTAGRAM_ACCESS_TOKEN is not set',
      checks: baseChecks,
    })
    return
  }

  const [tokenInfo, igId, igUsername, fbPageId, fbPageName, recentErrors] = await Promise.all([
    probe('debug_token', () => inspectToken(token)),
    probe('getBusinessAccountId', () => getBusinessAccountId()),
    probe('getBusinessUsername', () => getBusinessUsername()),
    probe('getFacebookPageId', () => getFacebookPageId()),
    probe('getFacebookPageName', () => getFacebookPageName()),
    readRecentPublishErrors(5).catch(() => []),
  ])

  const ok =
    baseChecks.hasPublicBaseUrl
    && baseChecks.publicBaseUrlIsHttps
    && tokenInfo.ok
    && (tokenInfo.value?.isValid ?? false)
    && igId.ok
    && fbPageId.ok

  res.json({
    ok,
    checks: baseChecks,
    token: tokenInfo.ok
      ? {
          isValid: tokenInfo.value?.isValid ?? false,
          expiresAt: tokenInfo.value?.expiresAt ?? null,
          scopes: tokenInfo.value?.scopes ?? [],
          appId: tokenInfo.value?.appId ?? null,
        }
      : { error: tokenInfo.error },
    instagram: {
      businessAccountId: igId.value ?? null,
      username: igUsername.value ?? null,
      error: igId.error ?? null,
    },
    facebook: {
      pageId: fbPageId.value ?? null,
      pageName: fbPageName.value ?? null,
      error: fbPageId.error ?? null,
    },
    recentErrors,
  })
}
