import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Link } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { fetchMyBookings, issueCheckinToken } from '../data/queries'
import { Wordmark } from '../components/Logo'
import { dateOf, timeOf } from '../lib/format'
import { useAuth } from '../auth/AuthProvider'

/** Bookings whose code can be shown at the door. */
const SCANNABLE = ['confirmed', 'late_notified']

export function CheckIn() {
  const { session } = useAuth()
  const bookings = useAsync(
    () => (session ? fetchMyBookings() : Promise.resolve([])),
    [session?.user.id],
  )

  const active = useMemo(() => {
    const rows = (bookings.data ?? []).filter((b) => SCANNABLE.includes(b.status))
    // Soonest first — the one they're most likely at the door for.
    return rows.sort((a, b) => +new Date(a.slot_start) - +new Date(b.slot_start))[0] ?? null
  }, [bookings.data])

  if (!session)
    return (
      <Screen nav={<BottomNav />}>
        <Header />
        <Empty title="Sign in to check in" note="Your code lives with your booking." />
        <Link to="/signin" className="btn mx-5 mt-2 block">
          Sign in
        </Link>
      </Screen>
    )

  if (bookings.loading)
    return (
      <Screen nav={<BottomNav />}>
        <Header />
        <Spinner label="Finding your table" />
      </Screen>
    )

  // An error and an empty result must not render the same screen — that is how
  // a broken query reads as "nothing booked" and hides itself.
  if (bookings.error)
    return (
      <Screen nav={<BottomNav />}>
        <Header />
        <Empty title="Couldn't load your bookings" note={bookings.error} />
      </Screen>
    )

  // No live booking: show the permanent profile code (CHK-04). Staff scan it to
  // look a guest up or seat a walk-in, so this screen is never a dead end.
  if (!active)
    return (
      <Screen nav={<BottomNav />}>
        <Header />
        <ProfileCard userId={session.user.id} email={session.user.email ?? ''} />
      </Screen>
    )

  return (
    <Screen nav={<BottomNav />}>
      <Header />
      <TokenCard bookingId={active.id} />
      <div className="px-6 pt-8 text-center">
        <p className="eyebrow">Confirmed</p>
        <h1 className="mt-3 font-display text-[28px] leading-tight text-fg">
          {active.venues?.name_en}
        </h1>
        <p className="smallcaps mt-2 text-[10px] text-muted">
          {dateOf(active.slot_start)} · {timeOf(active.slot_start)} · {active.party_size} guests
        </p>
        <Link to={`/booking/${active.id}`} className="smallcaps mt-6 inline-block text-goldt">
          Booking details
        </Link>
      </div>
      <div className="h-12" />
    </Screen>
  )
}

function Header() {
  return (
    <div className="px-5 pb-2 pt-[max(52px,env(safe-area-inset-top))]">
      <p className="text-center font-display text-[15px] uppercase tracking-[0.5em] text-goldt">
        Check in
      </p>
    </div>
  )
}

/**
 * The token rotates on a 30-second window server-side, so the card refetches
 * on that cadence. A screenshot is useless — which is the point.
 */
function TokenCard({ bookingId }: { bookingId: string }) {
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [left, setLeft] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stop = false
    async function pull() {
      try {
        const t = await issueCheckinToken(bookingId)
        if (stop) return
        setToken(t.token)
        setCode(t.fallback_code ?? null)
        setLeft(t.seconds_remaining ?? 30)
        setError(null)
      } catch (e) {
        if (!stop) setError((e as Error).message)
      }
    }
    pull()
    const id = setInterval(pull, 25_000)
    return () => {
      stop = true
      clearInterval(id)
    }
  }, [bookingId])

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!token || !canvas.current) return
    QRCode.toCanvas(canvas.current, token, {
      width: 220,
      margin: 1,
      color: { dark: '#0B0B0C', light: '#FFFFFF' },
    }).catch(() => setError('Could not draw the code'))
  }, [token])

  if (error)
    return (
      <div className="px-6 pt-10 text-center">
        <p className="text-[13px] leading-relaxed text-burg">{error}</p>
        <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
          Codes only work from about thirty minutes before your table until your grace period ends.
        </p>
      </div>
    )

  return (
    <div className="pt-8 text-center">
      <div className="mx-auto w-[252px] bg-white p-4">
        <canvas ref={canvas} className="mx-auto block h-[220px] w-[220px]" />
      </div>
      {code && (
        <p className="mt-6 font-ui text-[19px] tracking-[0.4em] text-goldt">
          {code.slice(0, 3)} {code.slice(3)}
        </p>
      )}
      <div className="smallcaps mt-4 flex items-center justify-center gap-2 text-[9px] text-muted">
        <span className="block h-1.5 w-1.5 rounded-full bg-goldt" />
        Refreshes in {left}s
      </div>
      <p className="mx-auto mt-4 max-w-[30ch] text-[10.5px] leading-relaxed text-muted">
        Show this at the host stand. It changes every thirty seconds, so a screenshot won’t work.
      </p>
    </div>
  )
}

/**
 * The guest's permanent code. Not a booking token — it identifies the person,
 * so it does not rotate and is safe to keep on screen.
 */
function ProfileCard({ userId, email }: { userId: string; email: string }) {
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const code = userId.replace(/-/g, '').slice(0, 6).toUpperCase()

  useEffect(() => {
    if (!canvas.current) return
    QRCode.toCanvas(canvas.current, `qseat:guest:${userId}`, {
      width: 220,
      margin: 1,
      color: { dark: '#0B0B0C', light: '#FFFFFF' },
    }).catch(() => {})
  }, [userId])

  return (
    <div className="pt-6 text-center">
      <div className="mx-auto mb-7 flex justify-center">
        <Wordmark size={20} />
      </div>
      <div className="mx-auto w-[252px] bg-white p-4">
        <canvas ref={canvas} className="mx-auto block h-[220px] w-[220px]" />
      </div>
      <p className="mt-6 font-ui text-[19px] tracking-[0.4em] text-goldt">
        {code.slice(0, 3)} {code.slice(3)}
      </p>
      <p className="smallcaps mt-3 text-[9px] text-muted">{email}</p>
      <p className="mx-auto mt-6 max-w-[30ch] text-[11.5px] leading-relaxed text-muted">
        This is your QSeat code. Show it at the door for a walk-in, or when the host wants to find
        you on the list.
      </p>
      <p className="mx-auto mt-4 max-w-[30ch] text-[11.5px] leading-relaxed text-muted">
        When you have a confirmed table, a booking code replaces this about half an hour before
        you're due.
      </p>
      <Link to="/" className="btn btn-ghost mx-5 mt-8 block">
        Find somewhere for tonight
      </Link>
    </div>
  )
}
