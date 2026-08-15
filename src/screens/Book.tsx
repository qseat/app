import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Screen'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import {
  acquireHold,
  createBooking,
  fetchAmenities,
  fetchSlots,
  fetchVenue,
  joinWaitlist,
} from '../data/queries'
import { nextDays, reasonLabel, timeOf } from '../lib/format'
import { useAuth } from '../auth/AuthProvider'
import type { Slot } from '../data/types'

const OCCASIONS = [
  { v: null, l: 'None' },
  { v: 'birthday', l: 'Birthday' },
  { v: 'anniversary', l: 'Anniversary' },
  { v: 'business', l: 'Business' },
  { v: 'casual', l: 'Casual' },
]

export function Book() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { session } = useAuth()

  const v = useAsync(() => fetchVenue(slug), [slug])
  const amenities = useAsync(fetchAmenities, [])
  const days = useMemo(() => nextDays(14), [])

  const [spaceId, setSpaceId] = useState<string | null>(params.get('space'))
  const [dateKey, setDateKey] = useState(days[0].key)
  const [party, setParty] = useState(2)
  const [slotStart, setSlotStart] = useState<string | null>(null)
  const [occasion, setOccasion] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<string[]>([])
  const [requests, setRequests] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waitlisted, setWaitlisted] = useState<string | null>(null)

  const spaces = useMemo(
    () =>
      (v.data?.venue_spaces ?? [])
        .filter((s) => s.is_active !== false)
        .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99)),
    [v.data],
  )

  useEffect(() => {
    if (!spaceId && spaces.length) setSpaceId(spaces[0].id)
  }, [spaces, spaceId])

  const space = spaces.find((s) => s.id === spaceId) ?? null

  const slots = useAsync(
    () => (spaceId ? fetchSlots(spaceId, dateKey, party) : Promise.resolve<Slot[]>([])),
    [spaceId, dateKey, party],
  )

  // A sentinel row carries a reason and no slot_start.
  const sentinel = slots.data?.find((s) => !s.slot_start && s.unavailable_reason) ?? null
  const real = (slots.data ?? []).filter((s) => s.slot_start)

  useEffect(() => setSlotStart(null), [spaceId, dateKey, party])

  async function waitlist(slot: string) {
    if (!session) {
      nav('/signin', { state: { from: `/book/${slug}` } })
      return
    }
    setError(null)
    try {
      await joinWaitlist(v.data!.id, spaceId, slot, party)
      setWaitlisted(slot)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function submit() {
    if (!spaceId || !slotStart) return
    if (!session) {
      nav('/signin', { state: { from: `/book/${slug}` } })
      return
    }
    setBusy(true)
    setError(null)
    try {
      const holdId = await acquireHold(spaceId, slotStart, party)
      const bookingId = await createBooking({
        holdId,
        partySize: party,
        occasion,
        specialRequests: requests.trim() || null,
        preferences: prefs.map((amenity_id) => ({ amenity_id, is_negated: false })),
      })
      nav(`/booking/${bookingId}`, { replace: true })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (v.loading) return <Screen><Spinner full /></Screen>
  if (!v.data) return <Screen><TopBar /><Empty title="Couldn’t load this place" /></Screen>

  const partyOptions = space
    ? Array.from(
        { length: Math.max(1, Math.min(space.max_party, 12) - space.min_party + 1) },
        (_, i) => space.min_party + i,
      )
    : [1, 2, 3, 4, 5, 6]

  return (
    <Screen>
      <TopBar title="Reserve" />
      <div className="px-5 pt-6">
        <p className="t-eyebrow">
          {v.data.name_en}
          {space ? ` · ${space.name_en}` : ''}
        </p>

        <Field label="Room">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {spaces.map((s) => (
              <Chip key={s.id} on={s.id === spaceId} onClick={() => setSpaceId(s.id)}>
                {s.name_en}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Guests" value={String(party)}>
          <div className="flex flex-wrap gap-2">
            {partyOptions.map((n) => (
              <Chip key={n} on={n === party} onClick={() => setParty(n)} square>
                {n}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Date">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {days.map((d) => (
              <button
                key={d.key}
                onClick={() => setDateKey(d.key)}
                className={`flex h-14 w-[52px] flex-none flex-col items-center justify-center border ${
                  d.key === dateKey ? 'border-gold bg-gold text-black' : 'border-hair text-fg'
                }`}
              >
                <span className="text-[9px] uppercase tracking-[0.14em] opacity-70">{d.dow}</span>
                <span className="text-[15px]">{d.label}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Time" value={slotStart ? timeOf(slotStart) : undefined}>
          {slots.loading && <Spinner />}
          {!slots.loading && real.length === 0 && (
            <p className="py-3 text-[12.5px] leading-relaxed text-muted">
              {reasonLabel(sentinel?.unavailable_reason)}
            </p>
          )}
          {real.some((s) => (s.remaining_capacity ?? 0) <= 0) && (
            <p className="pb-3 text-[11px] leading-relaxed text-muted">
              Dimmed times are full — tap one to join the waitlist and we'll tell you if it opens.
            </p>
          )}
          <div className="grid grid-cols-4 gap-2">
            {real.map((s) => {
              const full = (s.remaining_capacity ?? 0) <= 0
              const on = s.slot_start === slotStart
              const queued = waitlisted === s.slot_start
              return (
                <button
                  key={s.slot_start!}
                  onClick={() => (full ? waitlist(s.slot_start!) : setSlotStart(s.slot_start!))}
                  title={full ? 'Full — tap to join the waitlist' : undefined}
                  className={`h-10 border text-[12px] ${
                    on
                      ? 'border-gold bg-gold text-black'
                      : queued
                        ? 'border-gold text-goldt'
                        : full
                          ? 'border-hair text-fg opacity-40'
                          : 'border-hair text-fg'
                  }`}
                >
                  {timeOf(s.slot_start!)}
                </button>
              )
            })}
          </div>
        </Field>

        {amenities.data && amenities.data.length > 0 && (
          <Field label="Preference" value={prefs.length ? `${prefs.length} chosen` : undefined}>
            <div className="flex flex-wrap gap-2">
              {amenities.data.slice(0, 10).map((a) => (
                <Chip
                  key={a.id}
                  on={prefs.includes(a.id)}
                  onClick={() =>
                    setPrefs((p) => (p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id]))
                  }
                >
                  {a.name_en}
                </Chip>
              ))}
            </div>
          </Field>
        )}

        <Field label="Occasion">
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <Chip key={o.l} on={occasion === o.v} onClick={() => setOccasion(o.v)}>
                {o.l}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Anything else">
          <textarea
            value={requests}
            onChange={(e) => setRequests(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="A quiet corner, a high chair, a view of the water…"
            className="w-full border border-hair bg-surface p-3 text-[13px] text-fg outline-none placeholder:text-muted focus:border-gold"
          />
        </Field>
      </div>

      {waitlisted && (
        <p className="px-5 pb-2 text-[12.5px] leading-relaxed text-goldt">
          You're on the waitlist for {timeOf(waitlisted)}. We'll notify you if a table opens.
        </p>
      )}
      {error && <p className="px-5 pb-2 text-[12.5px] leading-relaxed text-burg">{error}</p>}

      <button className="btn mx-5 mt-2 block w-[calc(100%-40px)]" disabled={!slotStart || busy} onClick={submit}>
        {busy ? 'Holding your table' : slotStart ? `Request ${timeOf(slotStart)} for ${party}` : 'Choose a time'}
      </button>
      <p className="px-8 pt-3 text-center text-[10.5px] leading-relaxed text-muted">
        Held for two minutes while you finish. The house replies after that.
      </p>
      <div className="h-10" />
    </Screen>
  )
}

function Field({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-hair pb-4 pt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="t-meta text-[9px] text-muted">{label}</span>
        {value && <span className="t-title text-[16px] text-goldt">{value}</span>}
      </div>
      {children}
    </div>
  )
}

function Chip({
  on,
  onClick,
  children,
  square,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
  square?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`${square ? 'h-10 w-10' : 'h-10 px-3.5'} flex-none border text-[12.5px] ${
        on ? 'border-gold bg-gold text-black' : 'border-hair text-fg'
      }`}
    >
      {children}
    </button>
  )
}
