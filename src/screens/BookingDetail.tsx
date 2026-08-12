import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Screen'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import {
  fetchBooking,
  fetchBookingExtras,
  fetchBookingGuests,
  inviteGuest,
  requestExtra,
  transitionBooking,
} from '../data/queries'
import { dateOf, occasionLabel, statusLabel, timeOf } from '../lib/format'

export function BookingDetail() {
  const { id = '' } = useParams()
  const b = useAsync(() => fetchBooking(id), [id])
  const guests = useAsync(() => fetchBookingGuests(id), [id])
  const extras = useAsync(() => fetchBookingExtras(id), [id])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteName, setInviteName] = useState('')
  const [extraNote, setExtraNote] = useState('')
  const [extraType, setExtraType] = useState('cake')

  async function act(to: string, reason: string, payload: Record<string, unknown> = {}) {
    setBusy(true)
    setError(null)
    try {
      await transitionBooking(id, to, reason, payload)
      b.reload()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (b.loading) return <Screen><Spinner full /></Screen>
  if (!b.data)
    return (
      <Screen>
        <TopBar />
        <Empty title="Booking not found" note={b.error ?? undefined} />
      </Screen>
    )

  const booking = b.data
  const pending = booking.status === 'pending_venue'
  const countered = booking.status === 'counter_proposed'
  const cancellable = ['pending_venue', 'counter_proposed', 'confirmed', 'late_notified'].includes(
    booking.status,
  )

  return (
    <Screen>
      <TopBar title="Your table" />
      <div className="px-6 pt-10 text-center">
        <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full border border-goldt">
          <span className="absolute inset-[7px] rounded-full border border-hair" />
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-goldt stroke-[1]">
            {pending || countered ? (
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </>
            ) : (
              <path d="M12 2 14.6 8.2 21 9l-4.6 4.4L17.6 20 12 16.8 6.4 20l1.2-6.6L3 9l6.4-.8Z" />
            )}
          </svg>
        </div>

        <p className="eyebrow mt-6">{statusLabel(booking.status)}</p>
        <h1 className="mt-3 font-display text-[30px] leading-tight text-fg">
          {booking.venues?.name_en}
        </h1>
        <p className="smallcaps mt-2 text-[10px] text-muted">
          {dateOf(booking.slot_start)} · {timeOf(booking.slot_start)} ·{' '}
          {booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}
        </p>
        {booking.venue_spaces?.name_en && (
          <p className="mt-1 font-display text-[17px] text-fg2">{booking.venue_spaces.name_en}</p>
        )}
      </div>

      {countered && booking.counter_proposed_slot_start && (
        <div className="mx-5 mt-8 border border-gold p-5">
          <p className="eyebrow">The house offered a different time</p>
          <p className="mt-3 font-display text-[26px] text-fg">
            {timeOf(booking.counter_proposed_slot_start)}
          </p>
          <p className="mt-1 text-[12px] text-muted">
            instead of {timeOf(booking.slot_start)} — same room.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              className="btn flex-1"
              disabled={busy}
              onClick={() => act('confirmed', 'Guest accepted the offered time')}
            >
              Accept
            </button>
            <button
              className="btn btn-ghost flex-1"
              disabled={busy}
              onClick={() => act('cancelled_guest', 'Guest declined the offered time')}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 px-5">
        <Row k="Reference" v={booking.id.slice(0, 6).toUpperCase()} />
        {booking.assigned_space_label && <Row k="Table" v={booking.assigned_space_label} />}
        {occasionLabel(booking.occasion) && <Row k="Occasion" v={occasionLabel(booking.occasion)!} />}
        {booking.special_requests && <Row k="Your note" v={booking.special_requests} />}
        {pending && booking.sla_expires_at && (
          <Row k="Reply expected by" v={timeOf(booking.sla_expires_at)} />
        )}
      </div>

      {error && <p className="px-5 pt-4 text-[12.5px] leading-relaxed text-burg">{error}</p>}

      {['confirmed', 'late_notified'].includes(booking.status) && (
        <Link to="/checkin" className="btn mx-5 mt-8 block">
          Show my code
        </Link>
      )}

      {booking.status === 'confirmed' && (
        <div className="mx-5 mt-3 flex gap-3">
          {[10, 15, 30].map((m) => (
            <button
              key={m}
              disabled={busy}
              onClick={() => act('late_notified', `Guest running ${m} minutes late`, { delay_minutes: m })}
              className="smallcaps flex-1 border border-hair2 py-3 text-[10px] text-goldt"
            >
              +{m} min
            </button>
          ))}
        </div>
      )}
      {booking.status === 'confirmed' && (
        <p className="px-8 pt-2 text-center text-[10.5px] leading-relaxed text-muted">
          Running late? Tell the house and they'll hold your table.
        </p>
      )}

      {['pending_venue', 'counter_proposed', 'confirmed', 'late_notified'].includes(
        booking.status,
      ) && (
        <div className="mt-10 px-5">
          <p className="eyebrow pb-3">Who's coming</p>
          {(guests.data ?? []).map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between border-b border-hair2 py-3"
            >
              <span className="text-[13px] text-fg">{g.display_name ?? 'Guest'}</span>
              <span
                className="smallcaps text-[8.5px]"
                style={{
                  color: g.rsvp_status === 'accepted' ? 'var(--gold-text)' : 'var(--muted)',
                }}
              >
                {g.rsvp_status}
              </span>
            </div>
          ))}
          <div className="mt-4 flex gap-2">
            <input
              className="field flex-1"
              placeholder="Invite by name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
            <button
              className="btn px-5"
              disabled={!inviteName.trim() || busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await inviteGuest(id, inviteName.trim())
                  setInviteName('')
                  guests.reload()
                } catch (e) {
                  setError((e as Error).message)
                } finally {
                  setBusy(false)
                }
              }}
            >
              Add
            </button>
          </div>
          <p className="pt-2 text-[11px] leading-relaxed text-muted">
            The house sees the headcount, so it changes as people reply.
          </p>
        </div>
      )}

      {['confirmed', 'late_notified'].includes(booking.status) && (
        <div className="mt-10 px-5">
          <p className="eyebrow pb-3">Anything for the table</p>
          {(extras.data ?? []).map((x) => (
            <div key={x.id} className="flex items-baseline justify-between border-b border-hair2 py-3">
              <div>
                <span className="text-[13px] text-fg">{x.extra_type.replace(/_/g, ' ')}</span>
                {x.note && <p className="mt-0.5 text-[11.5px] text-muted">{x.note}</p>}
              </div>
              <span
                className="smallcaps text-[8.5px]"
                style={{
                  color:
                    x.status === 'confirmed'
                      ? 'var(--gold-text)'
                      : x.status === 'declined'
                        ? 'var(--burg)'
                        : 'var(--muted)',
                }}
              >
                {x.status}
              </span>
            </div>
          ))}
          <div className="mt-4 flex flex-wrap gap-2">
            {['cake', 'flowers', 'specific_table', 'privacy_screen'].map((k) => (
              <button
                key={k}
                onClick={() => setExtraType(k)}
                className={`h-9 border px-3.5 text-[11.5px] ${
                  extraType === k ? 'border-gold text-goldt' : 'border-hair2 text-fg'
                }`}
              >
                {k.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="field flex-1"
              placeholder="Any detail the house should know"
              value={extraNote}
              onChange={(e) => setExtraNote(e.target.value)}
            />
            <button
              className="btn px-5"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await requestExtra(id, extraType, extraNote.trim())
                  setExtraNote('')
                  extras.reload()
                } catch (e) {
                  setError((e as Error).message)
                } finally {
                  setBusy(false)
                }
              }}
            >
              Ask
            </button>
          </div>
          <p className="pt-2 text-[11px] leading-relaxed text-muted">
            The house confirms each request and settles anything chargeable with you directly —
            nothing is paid through QSeat.
          </p>
        </div>
      )}

      {['completed', 'checked_in', 'seated'].includes(booking.status) && (
        <Link to={`/review/${booking.id}`} className="btn mx-5 mt-8 block">
          Leave a note
        </Link>
      )}

      {cancellable && !countered && (
        <button
          className="btn btn-ghost mx-5 mt-3 block w-[calc(100%-40px)]"
          disabled={busy}
          onClick={() => act('cancelled_guest', 'Cancelled by the guest in the app')}
          style={{ borderColor: 'var(--burg)', color: 'var(--burg)' }}
        >
          Cancel this booking
        </button>
      )}
      <div className="h-12" />
    </Screen>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-hair2 py-3.5">
      <span className="smallcaps flex-none text-[9px] text-muted">{k}</span>
      <span className="text-right text-[13px] text-fg">{v}</span>
    </div>
  )
}
