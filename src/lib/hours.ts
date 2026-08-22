import type { VenueHours } from '../data/types'

const QATAR_TZ = 'Asia/Qatar'

function qatarNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: QATAR_TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return {
    dow: DOW.indexOf(get('weekday')),
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

export interface OpenState {
  isOpen: boolean
  today: { opens: string; closes: string; closesNextDay: boolean }[]
  opensAt: string | null
  closesAt: string | null
}

/**
 * Whether a venue is open right now, and today's window.
 *
 * Two things a naive comparison gets wrong: a shift closing after midnight
 * belongs to the day it opened, and yesterday's late shift can still be running
 * — a place closing at 02:00 is open at 00:30 on a day whose own shifts have
 * not started.
 */
export function openState(hours: VenueHours[] | undefined): OpenState {
  const rows = hours ?? []
  const { dow, minutes } = qatarNow()

  const today = rows
    .filter((h) => h.day_of_week === dow)
    .map((h) => ({
      opens: h.opens_at.slice(0, 5),
      closes: h.closes_at.slice(0, 5),
      closesNextDay: !!h.closes_next_day,
    }))
    .sort((a, b) => toMin(a.opens) - toMin(b.opens))

  let isOpen = today.some((s) => {
    const o = toMin(s.opens)
    const c = toMin(s.closes) + (s.closesNextDay ? 1440 : 0)
    return minutes >= o && minutes < c
  })

  if (!isOpen) {
    const yesterday = (dow + 6) % 7
    isOpen = rows.some(
      (h) =>
        h.day_of_week === yesterday &&
        h.closes_next_day &&
        minutes < toMin(h.closes_at.slice(0, 5)),
    )
  }

  return {
    isOpen,
    today,
    opensAt: today[0]?.opens ?? null,
    closesAt: today.length ? today[today.length - 1].closes : null,
  }
}
