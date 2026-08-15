import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Link } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { Empty } from '../components/Empty'
import { Wordmark } from '../components/Logo'
import { useAsync } from '../lib/useAsync'
import { fetchMyBookings, issueCheckinToken } from '../data/queries'
import { dateOf, timeOf } from '../lib/format'
import { useAuth } from '../auth/AuthProvider'
import type { Booking } from '../data/types'

const SCANNABLE = ['confirmed', 'late_notified']

/** The code opens this long before the table. Mirrors the server's window. */
const OPENS_MINUTES_BEFORE = 30

export function CheckIn() {
  const { session } = useAuth()
  const bookings = useAsync(
    () => (session ? fetchMyBookings() : Promise.resolve([])),
    [session?.user.id],
  )

  const live = useMemo(
    () =>
      (bookings.data ?? [])
        .filter((b) => SCANNABLE.includes(b.status))
        .sort((a, b) => +new Date(a.slot_start) - +new Date(b.slot_start)),
    [bookings.data],
  )
  const [index, setIndex] = useState(0)
  const deck = useRef<HTMLDivElement | null>(null)
  const active = live[Math.min(index, Math.max(0, live.length - 1))] ?? null

  if (!session)
    return (
      <Shell>
        <Empty title="Sign in to check in" note="Your code lives with your booking." />
        <Link to="/signin" className="btn mx-5 mt-4 block">
          Sign in
        </Link>
      </Shell>
    )

  if (bookings.loading)
    return (
      <Shell>
        <div className="px-5 pt-4">
          <div className="skeleton mx-auto h-[290px] w-[290px] rounded-xl" />
          <div className="skeleton mx-auto mt-8 h-5 w-40 rounded-full" />
        </div>
      </Shell>
    )

  if (bookings.error)
    return (
      <Shell>
        <Empty title="Couldn't load your bookings" note={bookings.error} />
      </Shell>
    )

  if (!active)
    return (
      <Shell>
        <ProfileCode userId={session.user.id} email={session.user.email ?? ''} />
      </Shell>
    )

  // More than one live booking: a swipeable deck rather than a hidden "soonest".
  // Someone with a lunch and a dinner needs the other one to be reachable, and
  // a silently-chosen booking is how a guest shows the wrong code at the door.
  return (
    <Shell>
      {live.length > 1 && (
        <>
          <div
            ref={deck}
            onScroll={() => {
              const el = deck.current
              if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth))
            }}
            className="deck pb-3"
          >
            {live.map((b, i) => (
              <button
                key={b.id}
                onClick={() => {
                  setIndex(i)
                  deck.current?.scrollTo({ left: i * (deck.current?.clientWidth ?? 0), behavior: 'smooth' })
                }}
                className="card card-lg px-5 py-4 text-left transition-opacity"
                style={{ opacity: i === index ? 1 : 0.5 }}
              >
                <p className="t-eyebrow text-[9px]">
                  {i === index ? 'Showing this code' : 'Tap to show'}
                </p>
                <p className="t-title mt-2 truncate text-[21px] text-fg">{b.venues?.name_en}</p>
                <p className="t-meta mt-1">
                  {dateOf(b.slot_start)} · {timeOf(b.slot_start)} · {b.party_size} guests
                </p>
              </button>
            ))}
          </div>
          <div className="mb-2 flex justify-center gap-1.5">
            {live.map((_, i) => (
              <span
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 16 : 5,
                  background: i === index ? 'var(--gold)' : 'var(--surface3)',
                }}
              />
            ))}
          </div>
        </>
      )}
      <BookingCode key={active.id} booking={active} showSummary={live.length === 1} />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Screen nav={<BottomNav />}>
      <div className="px-5 pb-3 pt-[max(56px,env(safe-area-inset-top))]">
        <div className="flex justify-center">
          <Wordmark size={19} />
        </div>
      </div>
      <div className="rise">{children}</div>
      <div className="h-10" />
    </Screen>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * The code is only mintable inside the arrival window, so being outside it is
 * the normal state for most of a booking's life — not an error. Showing the
 * function's raw refusal there was wrong twice over: it made an expected state
 * look broken, and it buried the booking the guest actually opened this to see.
 *
 * So: booking details first, always. Then either the live code, or a countdown
 * to when it opens. A genuine failure inside the window still surfaces, because
 * that one the guest needs to know about.
 */
function BookingCode({ booking, showSummary = true }: { booking: Booking; showSummary?: boolean }) {
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [left, setLeft] = useState(0)
  const [failed, setFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const opensAt = +new Date(booking.slot_start) - OPENS_MINUTES_BEFORE * 60_000
  const closesAt = booking.grace_expires_at
    ? +new Date(booking.grace_expires_at)
    : +new Date(booking.slot_start) + 90 * 60_000
  const isOpen = now >= opensAt && now <= closesAt
  const isPast = now > closesAt

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    let stop = false
    async function pull() {
      try {
        const t = await issueCheckinToken(booking.id)
        if (stop) return
        setToken(t.token)
        setCode(t.fallback_code ?? null)
        setLeft(t.seconds_remaining ?? 30)
        setFailed(false)
      } catch {
        if (!stop) setFailed(true)
      }
    }
    pull()
    const id = setInterval(pull, 25_000)
    return () => {
      stop = true
      clearInterval(id)
    }
  }, [booking.id, isOpen])

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!token || !canvas.current) return
    QRCode.toCanvas(canvas.current, token, {
      width: 260,
      margin: 0,
      color: { dark: '#0a0a0b', light: '#ffffff' },
    }).catch(() => setFailed(true))
  }, [token])

  return (
    <div className="px-5">
      {showSummary && <BookingSummary booking={booking} />}

      {isOpen && token && (
        <div className={showSummary ? 'mt-6 rise-2' : 'rise-2'}>
          <div className="mx-auto w-[300px] rounded-xl bg-white p-5 shadow-lg">
            <canvas ref={canvas} className="mx-auto block h-[260px] w-[260px]" />
          </div>
          {code && (
            <p className="mt-7 text-center font-ui text-[22px] tracking-[0.34em] text-goldsoft">
              {code.slice(0, 3)} {code.slice(3)}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span
              className="block h-1.5 w-1.5 rounded-full bg-gold"
              style={{ opacity: left % 2 ? 1 : 0.35, transition: 'opacity .6s' }}
            />
            <span className="t-meta text-[10.5px]">Refreshes in {left}s</span>
          </div>
          <p className="mx-auto mt-5 max-w-[32ch] text-center text-[12px] leading-relaxed text-muted">
            Show this at the host stand. It changes every thirty seconds, so a screenshot won't
            work.
          </p>
        </div>
      )}

      {isOpen && !token && !failed && (
        <div className="mt-6 rise-2">
          <div className="skeleton mx-auto h-[300px] w-[300px] rounded-xl" />
        </div>
      )}

      {isOpen && failed && (
        <LockedCard
          title="Couldn't reach the door"
          body="Your table is confirmed — show this screen to the host and they can find you by name."
          tone="danger"
        />
      )}

      {!isOpen && !isPast && <Countdown opensAt={opensAt} now={now} />}

      {isPast && (
        <LockedCard
          title="This code has closed"
          body="Your arrival window has passed. Speak to the host and they can still seat you."
        />
      )}
    </div>
  )
}

function BookingSummary({ booking }: { booking: Booking }) {
  return (
    <Link to={`/booking/${booking.id}`} className="card card-lg block px-6 py-6 text-center">
      <p className="t-t-eyebrow">Confirmed</p>
      <h1 className="t-title mt-3 text-[30px] text-fg">{booking.venues?.name_en}</h1>
      <p className="t-meta mt-2.5">
        {dateOf(booking.slot_start)} · {timeOf(booking.slot_start)} · {booking.party_size}{' '}
        {booking.party_size === 1 ? 'guest' : 'guests'}
      </p>
      {booking.venue_spaces?.name_en && (
        <p className="t-title mt-1.5 text-[17px] text-fg2">{booking.venue_spaces.name_en}</p>
      )}
      <p className="t-t-eyebrow mt-5 text-[9px]">Booking details ›</p>
    </Link>
  )
}

function Countdown({ opensAt, now }: { opensAt: number; now: number }) {
  const ms = Math.max(0, opensAt - now)
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  const near = ms < 60 * 60_000

  return (
    <div className="mt-6 rise-2">
      <div className="card card-lg px-6 py-10 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface2">
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-goldt stroke-[1.2]">
            <rect x="5" y="10" width="14" height="10" rx="3" />
            <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
          </svg>
        </div>
        <p className="t-t-eyebrow mt-6">Your code opens in</p>
        <p className="mt-3 t-title text-[46px] leading-none tracking-tight text-fg">
          {h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}:${String(s).padStart(2, '0')}`}
        </p>
        <p className="mx-auto mt-5 max-w-[30ch] text-[12.5px] leading-relaxed text-muted">
          {near
            ? 'Almost time. Keep this screen handy and your code will appear here.'
            : `Codes open thirty minutes before your table and stay live through your grace period.`}
        </p>
      </div>
    </div>
  )
}

function LockedCard({
  title,
  body,
  tone,
}: {
  title: string
  body: string
  tone?: 'danger'
}) {
  return (
    <div className="mt-6 rise-2">
      <div className="card card-lg px-6 py-9 text-center">
        <p
          className="t-title text-[21px]"
          style={{ color: tone === 'danger' ? 'var(--danger)' : 'var(--fg)' }}
        >
          {title}
        </p>
        <p className="mx-auto mt-3 max-w-[32ch] text-[12.5px] leading-relaxed text-muted">{body}</p>
      </div>
    </div>
  )
}

/** Permanent guest code — identifies a person, so it never rotates. */
function ProfileCode({ userId, email }: { userId: string; email: string }) {
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const code = userId.replace(/-/g, '').slice(0, 6).toUpperCase()

  useEffect(() => {
    if (!canvas.current) return
    QRCode.toCanvas(canvas.current, `qseat:guest:${userId}`, {
      width: 240,
      margin: 0,
      color: { dark: '#0a0a0b', light: '#ffffff' },
    }).catch(() => {})
  }, [userId])

  return (
    <div className="px-5">
      <div className="card card-lg px-6 pb-8 pt-8 text-center">
        <p className="t-t-eyebrow">Your QSeat code</p>
        <div className="mx-auto mt-6 w-[280px] rounded-xl bg-white p-5">
          <canvas ref={canvas} className="mx-auto block h-[240px] w-[240px]" />
        </div>
        <p className="mt-7 font-ui text-[22px] tracking-[0.34em] text-goldsoft">
          {code.slice(0, 3)} {code.slice(3)}
        </p>
        <p className="t-meta mt-2 text-[10.5px]">{email}</p>
        <p className="mx-auto mt-6 max-w-[30ch] text-[12.5px] leading-relaxed text-muted">
          Show this for a walk-in, or when a host wants to find you on the list. When you have a
          table, a booking code replaces it half an hour before.
        </p>
      </div>
      <Link to="/" className="btn btn-ghost mt-4 block">
        Find somewhere for tonight
      </Link>
    </div>
  )
}
