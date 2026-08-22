import { getClock } from './prefs'

const QATAR_TZ = 'Asia/Qatar'

/** Respects the device clock preference; 12-hour with AM/PM by default. */
export function timeOf(iso: string): string {
  const h12 = getClock() === '12'
  return new Date(iso)
    .toLocaleTimeString('en-GB', {
      hour: h12 ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: h12,
      timeZone: QATAR_TZ,
    })
    .replace(/\s?(am|pm)/i, (m) => m.trim().toUpperCase())
}

/** A wall-clock "HH:MM" from the database, formatted the same way. */
export function clockOf(hhmm: string): string {
  if (getClock() === '24') return hhmm.slice(0, 5)
  const h = Number(hhmm.slice(0, 2))
  const m = hhmm.slice(3, 5)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${m} ${suffix}`
}

/** Price band as a QAR amount band, never a dollar sign. */
export const PRICE_BAND_LABEL: Record<number, string> = {
  1: 'Under QAR 50',
  2: 'QAR 50 – 120',
  3: 'QAR 120 – 250',
  4: 'QAR 250+',
}

export function dateOf(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: QATAR_TZ,
  })
}

/** YYYY-MM-DD for a Date, in Qatar local time — what the RPCs expect. */
export function qatarDateKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: QATAR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function nextDays(count: number) {
  const out: { key: string; label: string; dow: string }[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    out.push({
      key: qatarDateKey(d),
      label: d.toLocaleDateString('en-GB', { day: 'numeric', timeZone: QATAR_TZ }),
      dow: i === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: QATAR_TZ }),
    })
  }
  return out
}

const OCCASIONS: Record<string, string> = {
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  business: 'Business',
  casual: 'Casual',
}
export const occasionLabel = (v?: string | null) => (v ? OCCASIONS[v] ?? v : null)

const STATUS: Record<string, string> = {
  draft: 'Draft',
  held: 'Holding',
  pending_venue: 'Awaiting the house',
  counter_proposed: 'New time offered',
  confirmed: 'Confirmed',
  late_notified: 'Running late',
  checked_in: 'Checked in',
  seated: 'Seated',
  completed: 'Completed',
  declined: 'Declined',
  cancelled_guest: 'Cancelled',
  cancelled_venue: 'Cancelled by the house',
  expired: 'Expired',
  no_show: 'No show',
}
export const statusLabel = (v: string) => STATUS[v] ?? v

export const LIVE_STATUSES = [
  'pending_venue',
  'counter_proposed',
  'confirmed',
  'late_notified',
  'checked_in',
  'seated',
]

const REASONS: Record<string, string> = {
  closed: 'Closed on this day',
  blackout: 'Not taking bookings on this date',
  space_inactive: 'This room is unavailable',
  date_in_past: 'That date has passed',
  beyond_horizon: 'Too far ahead to book',
  below_min_party: 'Too few guests for this room',
  over_max_party_size: 'Too many guests for this room',
  large_group_request: 'Large parties are arranged with the house directly',
  no_slots_remaining_today: 'No tables left today — try tomorrow',
}
export const reasonLabel = (v?: string | null) =>
  v ? REASONS[v] ?? 'No tables available' : 'No tables available'
