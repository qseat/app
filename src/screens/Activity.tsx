import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Screen } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { fetchMyBookings } from '../data/queries'
import { LIVE_STATUSES, dateOf, statusLabel, timeOf } from '../lib/format'
import { useAuth } from '../auth/AuthProvider'
import type { Booking } from '../data/types'

const ATTENTION = ['counter_proposed']

export function Activity() {
  const { session } = useAuth()
  const bookings = useAsync(
    () => (session ? fetchMyBookings() : Promise.resolve([])),
    [session?.user.id],
  )

  // A venue's reply should land without a pull-to-refresh. RLS applies to
  // realtime too, so only rows this guest may already read are delivered.
  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel('my-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `guest_id=eq.${session.user.id}` },
        () => bookings.reload(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user.id])

  if (!session)
    return (
      <Screen nav={<BottomNav />}>
        <Header />
        <Empty title="Nothing yet" note="Sign in to see your bookings and replies from venues." />
        <Link to="/signin" className="btn mx-5 mt-2 block">
          Sign in
        </Link>
      </Screen>
    )

  const rows = bookings.data ?? []
  const live = rows.filter((b) => LIVE_STATUSES.includes(b.status))
  const past = rows.filter((b) => !LIVE_STATUSES.includes(b.status))
  const unread = rows.filter((b) => ATTENTION.includes(b.status)).length

  return (
    <Screen nav={<BottomNav unread={unread} />}>
      <Header />
      {bookings.loading && <Spinner />}
      {bookings.error && <Empty title="Couldn’t load" note={bookings.error} />}
      {!bookings.loading && rows.length === 0 && (
        <Empty title="No bookings yet" note="Find somewhere for tonight and your table will appear here." />
      )}

      {live.length > 0 && (
        <>
          <p className="eyebrow px-5 pb-1 pt-7">Upcoming</p>
          {live.map((b) => <Item key={b.id} b={b} />)}
        </>
      )}
      {past.length > 0 && (
        <>
          <p className="eyebrow px-5 pb-1 pt-7">Earlier</p>
          {past.map((b) => <Item key={b.id} b={b} muted />)}
        </>
      )}
      <div className="h-10" />
    </Screen>
  )
}

function Header() {
  return (
    <div className="px-5 pb-2 pt-[max(52px,env(safe-area-inset-top))]">
      <p className="text-center font-display text-[15px] uppercase tracking-[0.5em] text-goldt">
        Bookings
      </p>
    </div>
  )
}

function Item({ b, muted }: { b: Booking; muted?: boolean }) {
  const attention = ATTENTION.includes(b.status)
  const bad = ['declined', 'cancelled_venue', 'no_show', 'expired'].includes(b.status)
  return (
    <Link
      to={`/booking/${b.id}`}
      className="flex gap-3.5 border-b border-hair2 px-5 py-4"
      style={{ opacity: muted ? 0.6 : 1 }}
    >
      <span
        className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full"
        style={{
          background: attention ? 'var(--gold)' : bad ? 'var(--burg)' : 'transparent',
          border: attention || bad ? 'none' : '1px solid var(--hair)',
        }}
      />
      <div className="min-w-0 flex-1">
        <h5 className="text-[13.5px] text-fg">{b.venues?.name_en}</h5>
        <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
          {dateOf(b.slot_start)} · {timeOf(b.slot_start)} · {b.party_size} guests
          {b.venue_spaces?.name_en ? ` · ${b.venue_spaces.name_en}` : ''}
        </p>
        <p
          className="smallcaps pt-2 text-[8.5px]"
          style={{ color: attention ? 'var(--gold-text)' : bad ? 'var(--burg)' : 'var(--muted)' }}
        >
          {statusLabel(b.status)}
          {attention ? ' — tap to reply' : ''}
        </p>
      </div>
    </Link>
  )
}
