import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchFavouriteIds, toggleFavourite } from '../data/queries'
import { useAuth } from '../auth/AuthProvider'

export function FavouriteButton({ venueId, floating }: { venueId: string; floating?: boolean }) {
  const { session } = useAuth()
  const nav = useNavigate()
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!session) return
    fetchFavouriteIds()
      .then((ids) => setOn(ids.includes(venueId)))
      .catch(() => {})
  }, [session?.user.id, venueId])

  async function click(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!session) {
      nav('/signin')
      return
    }
    const next = !on
    setOn(next)
    setBusy(true)
    try {
      await toggleFavourite(venueId, next)
    } catch {
      setOn(!next) // roll back a failed write rather than lie about it
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={click}
      disabled={busy}
      aria-label={on ? 'Remove from saved' : 'Save this place'}
      className={
        floating
          ? 'grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/45'
          : 'grid h-10 w-10 place-items-center rounded-full border border-hair'
      }
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px] stroke-[1.3]"
        style={{
          fill: on ? 'var(--gold)' : 'none',
          stroke: on ? 'var(--gold)' : floating ? '#fff' : 'var(--fg)',
        }}
      >
        <path d="M12 20s-7-4.6-7-9.5A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.5C19 15.4 12 20 12 20Z" />
      </svg>
    </button>
  )
}
