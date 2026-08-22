import { useEffect, useState } from 'react'

export type Clock = '12' | '24'

function read(): Clock {
  try {
    return (localStorage.getItem('qseat-clock') as Clock) ?? '12'
  } catch {
    return '12'
  }
}

/**
 * Device preferences, deliberately not on the profile — these are about this
 * phone, and a guest on a new phone expects it to behave like a new phone.
 */
let clockValue: Clock = read()
const listeners = new Set<(c: Clock) => void>()

export const getClock = () => clockValue

export function setClock(c: Clock) {
  clockValue = c
  try {
    localStorage.setItem('qseat-clock', c)
  } catch {
    /* private mode */
  }
  listeners.forEach((fn) => fn(c))
}

export function useClock(): Clock {
  const [c, setC] = useState(clockValue)
  useEffect(() => {
    listeners.add(setC)
    return () => {
      listeners.delete(setC)
    }
  }, [])
  return c
}
