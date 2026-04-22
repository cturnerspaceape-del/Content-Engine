import { useEffect, useState } from 'react'

function readInitial<T>(key: string, fallback: T | (() => T)): T {
  try {
    const raw = localStorage.getItem(key)
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
  const [value, setValue] = useState<T>(() => readInitial(key, initial))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or unavailable — non-fatal
    }
  }, [key, value])

  return [value, setValue]
}
