import { Link } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { fetchAreas } from '../data/queries'
import { mediaUrl, focalStyle, W } from '../lib/media'

export function Places() {
  const areas = useAsync(fetchAreas, [])
  return (
    <Screen nav={<BottomNav />}>
      <div className="px-5 pb-2 pt-[max(52px,env(safe-area-inset-top))]">
        <p className="text-center t-title text-[15px] uppercase tracking-[0.5em] text-goldt">
          Places
        </p>
      </div>
      {areas.loading && <Spinner />}
      {areas.error && <Empty title="Couldn’t load areas" note={areas.error} />}
      <div className="grid grid-cols-2 gap-3 px-5 pt-4">
        {areas.data?.map((a) => (
          <Link key={a.id} to={`/area/${a.slug}`} className="relative h-[150px] bg-surface2">
            {mediaUrl(a.hero_media_url, { width: W.tile, height: 450 }, 'area') && (
              <img
                src={mediaUrl(a.hero_media_url, { width: W.tile, height: 450 }, 'area')!}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
                style={focalStyle(a.hero_focal_x, a.hero_focal_y)}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
            <div className="absolute inset-x-3 bottom-3">
              <p className="t-title text-[17px] leading-tight text-white">{a.name_en}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="h-10" />
    </Screen>
  )
}
