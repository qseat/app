import { useParams } from 'react-router-dom'
import { Screen, TopBar } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { VenuePlate } from '../components/VenueCard'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { fetchAreas, fetchVenues } from '../data/queries'

export function AreaDetail() {
  const { slug = '' } = useParams()
  const areas = useAsync(fetchAreas, [])
  const area = areas.data?.find((a) => a.slug === slug) ?? null
  const venues = useAsync(
    () => (area ? fetchVenues({ areaId: area.id }) : Promise.resolve([])),
    [area?.id],
  )

  return (
    <Screen nav={<BottomNav />}>
      <TopBar title={area?.name_en ?? 'Area'} />
      {area?.description_en && (
        <p className="px-5 pt-5 text-[13px] leading-relaxed text-fg2">{area.description_en}</p>
      )}
      <div className="flex items-baseline justify-between px-5 pb-1 pt-6">
        <p className="t-eyebrow">{venues.data?.length ?? 0} places</p>
      </div>
      {(areas.loading || venues.loading) && <Spinner />}
      {venues.data?.length === 0 && !venues.loading && (
        <Empty title="Nothing here yet" note="No published venues in this area — try another." />
      )}
      <div className="space-y-3.5 px-5">
        {venues.data?.map((v) => <VenuePlate key={v.id} venue={v} />)}
      </div>
      <div className="h-10" />
    </Screen>
  )
}
