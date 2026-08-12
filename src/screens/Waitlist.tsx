import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { claimWaitlistOffer, fetchMyWaitlist, leaveWaitlist } from '../data/queries'
import { dateOf, timeOf } from '../lib/format'
import { useAuth } from '../auth/AuthProvider'

export function Waitlist() {
  const { session } = useAuth()
  const nav = useNavigate()
  const list = useAsync(
    () => (session ? fetchMyWaitlist() : Promise.resolve([])),
    [session?.user.id],
  )
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!session)
    return (
      <Screen nav={<BottomNav />}>
        <TopBar title="Waitlist" />
        <Empty title="Nothing waiting" note="Sign in to see tables you're queued for." />
      </Screen>
    )

  async function claim(id: string) {
    setBusy(id)
    setError(null)
    try {
      const bookingId = await claimWaitlistOffer(id)
      nav(`/booking/${bookingId}`, { replace: true })
    } catch (e) {
      setError((e as Error).message)
      list.reload()
    } finally {
      setBusy(null)
    }
  }

  async function leave(id: string) {
    setBusy(id)
    try {
      await leaveWaitlist(id)
      list.reload()
    } finally {
      setBusy(null)
    }
  }

  const rows = list.data ?? []

  return (
    <Screen nav={<BottomNav />}>
      <TopBar title="Waitlist" />
      {list.loading && <Spinner />}
      {!list.loading && rows.length === 0 && (
        <Empty
          title="Not waiting on anything"
          note="When a time is full, join the waitlist and we'll hold it for you if it opens."
        />
      )}
      <div className="px-5">
        {rows.map((w) => {
          const offered = w.status === 'offered'
          return (
            <div key={w.id} className="border-b border-hair2 py-5">
              <p className="eyebrow">{offered ? 'A table has opened' : 'Waiting'}</p>
              <h4 className="mt-2 font-display text-[21px] leading-tight text-fg">
                {w.venues?.name_en ?? 'Venue'}
              </h4>
              <p className="smallcaps mt-1 text-[9.5px] text-muted">
                {dateOf(w.desired_slot_start)} · {timeOf(w.desired_slot_start)} · {w.party_size}{' '}
                guests
              </p>
              {offered && w.claim_expires_at && (
                <p className="mt-2 text-[11.5px] text-goldt">
                  Held until {timeOf(w.claim_expires_at)} — claim it before then.
                </p>
              )}
              <div className="mt-4 flex gap-3">
                {offered && (
                  <button
                    className="btn flex-1"
                    disabled={busy === w.id}
                    onClick={() => claim(w.id)}
                  >
                    {busy === w.id ? 'Claiming' : 'Claim this table'}
                  </button>
                )}
                <button
                  className="smallcaps flex-1 border border-hair2 py-3 text-[10px] text-muted"
                  disabled={busy === w.id}
                  onClick={() => leave(w.id)}
                >
                  Leave the queue
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {error && <p className="px-5 pt-4 text-[12.5px] leading-relaxed text-burg">{error}</p>}
      {error && (
        <p className="px-5 pt-2 text-[11.5px] leading-relaxed text-muted">
          Someone may have claimed it first — that table is released to whoever answers soonest.
        </p>
      )}
      <div className="h-10" />
    </Screen>
  )
}
