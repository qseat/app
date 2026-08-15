import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Screen'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { fetchBooking, fetchMyReviewFor, submitReview } from '../data/queries'
import { dateOf } from '../lib/format'

const FACETS = [
  { k: 'service', l: 'Service' },
  { k: 'ambience', l: 'Ambience' },
  { k: 'value', l: 'Value' },
] as const

export function Review() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const b = useAsync(() => fetchBooking(id), [id])
  const existing = useAsync(() => fetchMyReviewFor(id), [id])

  const [overall, setOverall] = useState(0)
  const [facets, setFacets] = useState<Record<string, number>>({})
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (b.loading || existing.loading) return <Screen><Spinner full /></Screen>
  if (!b.data) return <Screen><TopBar /><Empty title="Booking not found" /></Screen>

  if (existing.data)
    return (
      <Screen>
        <TopBar title="Your note" />
        <div className="px-6 pt-12 text-center">
          <p className="t-title text-[46px] leading-none text-goldt">
            {existing.data.overall}
          </p>
          <p className="t-meta mt-3 text-[9px] text-muted">out of five</p>
          {existing.data.body && (
            <p className="mx-auto mt-7 max-w-[34ch] t-title text-[17px] italic leading-relaxed text-fg2">
              {existing.data.body}
            </p>
          )}
          <p className="mt-8 text-[12px] text-muted">Thank you — it helps the next guest.</p>
        </div>
      </Screen>
    )

  async function send() {
    setBusy(true)
    setError(null)
    try {
      await submitReview({
        bookingId: id,
        venueId: b.data!.venue_id,
        overall,
        service: facets.service ?? null,
        ambience: facets.ambience ?? null,
        value: facets.value ?? null,
        body,
      })
      nav(`/booking/${id}`, { replace: true })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <TopBar title="Leave a note" />
      <div className="px-5 pt-7">
        <p className="t-eyebrow">{b.data.venues?.name_en}</p>
        <h1 className="mt-2 t-title text-[30px] leading-tight text-fg">How was it?</h1>
        <p className="mt-2 text-[12px] text-muted">{dateOf(b.data.slot_start)}</p>

        <div className="pb-5 pt-8">
          <p className="t-meta mb-3 text-[9px] text-muted">Overall</p>
          <Stars value={overall} onChange={setOverall} large />
        </div>

        {FACETS.map((f) => (
          <div key={f.k} className="flex items-center justify-between border-t border-hair py-4">
            <span className="text-[13px] text-fg">{f.l}</span>
            <Stars
              value={facets[f.k] ?? 0}
              onChange={(v) => setFacets((s) => ({ ...s, [f.k]: v }))}
            />
          </div>
        ))}

        <textarea
          rows={4}
          maxLength={1200}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What should the next guest know?"
          className="mt-6 w-full border border-hair bg-surface p-3 text-[13px] text-fg outline-none placeholder:text-muted focus:border-gold"
        />
      </div>

      {error && <p className="px-5 pt-3 text-[12.5px] leading-relaxed text-burg">{error}</p>}

      <button
        className="btn mx-5 mt-6 block w-[calc(100%-40px)]"
        disabled={!overall || busy}
        onClick={send}
      >
        {busy ? 'Sending' : 'Publish'}
      </button>
      <div className="h-12" />
    </Screen>
  )
}

function Stars({
  value,
  onChange,
  large,
}: {
  value: number
  onChange: (n: number) => void
  large?: boolean
}) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-label={`${n} of 5`}>
          <svg
            viewBox="0 0 24 24"
            className={`${large ? 'h-9 w-9' : 'h-5 w-5'} stroke-[1]`}
            style={{
              fill: n <= value ? 'var(--gold)' : 'none',
              stroke: n <= value ? 'var(--gold)' : 'var(--muted)',
            }}
          >
            <path d="M12 2 14.6 8.2 21 9l-4.6 4.4L17.6 20 12 16.8 6.4 20l1.2-6.6L3 9l6.4-.8Z" />
          </svg>
        </button>
      ))}
    </div>
  )
}
