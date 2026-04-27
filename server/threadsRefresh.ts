import { refreshThreadsToken } from './threads'

// Long-lived Threads tokens last 60 days but only refresh after they're at
// least 24 hours old. We hit /refresh_access_token weekly to keep them rolling
// — Threads rotates the token value AND extends the expiry by 60 days from
// the refresh time. Without this, you'd silently lose posting capability two
// months after the last manual mint.
//
// IMPORTANT: this updates process.env.THREADS_ACCESS_TOKEN in memory only.
// For Railway, the most reliable durable fix is to also update the env var
// via the Railway API, but that is out of scope for the first cut — so make
// sure to manually rotate the .env / Railway env vars at least once every
// 60 days. The console.log lines surface refresh outcomes in Railway logs
// so you can see when the in-memory token rotated.

const REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

let timer: NodeJS.Timeout | null = null

async function tick(): Promise<void> {
  try {
    const { accessToken, expiresInSec } = await refreshThreadsToken()
    process.env.THREADS_ACCESS_TOKEN = accessToken
    const days = Math.round(expiresInSec / 86_400)
    console.log(`[threads] refreshed token in-memory; expires in ~${days}d`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[threads] token refresh failed: ${message}`)
  }
}

export function startThreadsTokenRefresh(): void {
  if (timer) return
  if (!process.env.THREADS_ACCESS_TOKEN) return
  // Skip the immediate refresh on cold start — fresh deploys often have
  // tokens younger than 24h and would 400. Wait one full interval first.
  timer = setInterval(() => {
    void tick()
  }, REFRESH_INTERVAL_MS)
  if (typeof timer.unref === 'function') timer.unref()
  console.log('[threads] token refresh scheduled (every 7d)')
}
