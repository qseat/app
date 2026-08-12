import { useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { VenueRow } from '../components/VenueCard'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { fetchCollectionVenues, fetchCollections } from '../data/queries'
import { useI18n, localised } from '../lib/i18n'

export function Collection() {
  const { slug = '' } = useParams()
  const { lang } = useI18n()
  const all = useAsync(fetchCollections, [])
  const venues = useAsync(() => fetchCollectionVenues(slug), [slug])
  const c = all.data?.find((x) => x.slug === slug) ?? null

  return (
    <Screen nav={<BottomNav />}>
      <TopBar title={c ? localised(lang, c.title_en, c.title_ar) : 'Collection'} />
      {c?.subtitle_en && (
        <p className="px-5 pt-5 text-[13px] leading-relaxed text-fg2">{c.subtitle_en}</p>
      )}
      {venues.loading && <Spinner />}
      {!venues.loading && (venues.data?.length ?? 0) === 0 && (
        <Empty title="Nothing in this collection yet" />
      )}
      <div className="px-5 pt-4">
        {venues.data?.map((v) => <VenueRow key={v.id} venue={v} />)}
      </div>
      <div className="h-10" />
    </Screen>
  )
}
