import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Screen, TopBar } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { VenueRow } from '../components/VenueCard'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { createList, fetchFavouriteVenues, fetchLists } from '../data/queries'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../lib/i18n'

export function Saved() {
  const { session } = useAuth()
  const { t } = useI18n()
  const favs = useAsync(
    () => (session ? fetchFavouriteVenues() : Promise.resolve([])),
    [session?.user.id],
  )
  const lists = useAsync(() => (session ? fetchLists() : Promise.resolve([])), [session?.user.id])
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)

  if (!session)
    return (
      <Screen nav={<BottomNav />}>
        <TopBar title={t('favourites')} />
        <Empty title="Nothing saved" note="Sign in to keep places you like." />
        <Link to="/signin" className="btn mx-5 mt-2 block">
          {t('signIn')}
        </Link>
      </Screen>
    )

  async function add() {
    if (!newName.trim()) return
    setBusy(true)
    try {
      await createList(newName.trim())
      setNewName('')
      lists.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen nav={<BottomNav />}>
      <TopBar title={t('favourites')} />

      {favs.loading && <Spinner />}
      {!favs.loading && (favs.data?.length ?? 0) === 0 && (
        <Empty title="No saved places yet" note="Tap the heart on any place to keep it here." />
      )}
      <div className="px-5">
        {favs.data?.map((v) => <VenueRow key={v.id} venue={v} />)}
      </div>

      <p className="t-eyebrow px-5 pb-2 pt-9">{t('lists')}</p>
      <div className="px-5">
        {lists.data?.map((l) => (
          <div key={l.id} className="flex items-baseline justify-between border-b border-hair py-4">
            <span className="t-title text-[19px] text-fg">{l.name}</span>
            <span className="t-meta text-[9px] text-muted">
              {l.saved_list_items?.length ?? 0} places
            </span>
          </div>
        ))}
        <div className="mt-5 flex gap-2">
          <input
            className="field flex-1"
            placeholder="New list — Date night, Work spots…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="btn px-5" disabled={busy || !newName.trim()} onClick={add}>
            Add
          </button>
        </div>
      </div>
      <div className="h-10" />
    </Screen>
  )
}
