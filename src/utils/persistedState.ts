import { useEffect, useState } from 'react'

function readInitial<T>(
  storage: Storage,
  key: string,
  fallback: T | (() => T),
): T {
  try {
    const raw = storage.getItem(key)
    if (raw !== null) return JSON.parse(raw) as T
  } catch {
    // corrupt JSON — fall through to fallback
  }
  return typeof fallback === 'function' ? (fallback as () => T)() : fallback
}

export function usePersistedState<T>(
  key: string,
  initial: T | (() => T),
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readInitial(localStorage, key, initial))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or unavailable — non-fatal
    }
  }, [key, value])

  return [value, setValue]
}

// sessionStorage variant — survives reloads inside the same tab/PWA session
// but is cleared when the tab/PWA is fully closed (e.g. swiped away from the
// iOS app switcher). Use for ephemeral session state like the current view,
// where backgrounding-then-resuming should restore the page but a full kill
// should reset to the home screen.
export function useSessionState<T>(
  key: string,
  initial: T | (() => T),
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readInitial(sessionStorage, key, initial))

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or unavailable — non-fatal
    }
  }, [key, value])

  return [value, setValue]
}
