import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Screen, SectionHead } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { VenueRow, VenueTile } from '../components/VenueCard'
import { Meridian } from '../components/Meridian'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { fetchAreas, fetchVenues, searchVenues } from '../data/queries'
import { mediaUrl } from '../lib/supabase'
import type { VenueSummary } from '../data/types'

/** Placeholder shape until a venue-level availability summary RPC exists. */
const DEMO_PATTERN = [false, false, true, false, true, true, false, false, true, false, true, true]

export function Home() {
  const [term, setTerm] = useState('')
  const areas = useAsync(fetchAreas, [])
  const venues = useAsync(() => fetchVenues({ limit: 40 }), [])
  const results = useAsync(
    () => (term.trim().length > 1 ? searchVenues(term.trim()) : Promise.resolve(null)),
    [term],
  )

  const hero = useMemo(() => venues.data?.[0] ?? null, [venues.data])
  const rest = venues.data?.slice(1) ?? []
  const searching = term.trim().length > 1

  return (
    <Screen nav={<BottomNav />}>
      <div className="sticky top-0 z-40 bg-bg/90 px-5 pb-4 pt-[max(52px,env(safe-area-inset-top))] backdrop-blur-xl">
        <p className="mb-4 text-center font-display text-[15px] uppercase tracking-[0.5em] text-goldt">
          QSeat
        </p>
        <div className="flex items-center gap-3 border border-hair bg-card px-4">
          <svg viewBox="0 0 16 16" className="h-4 w-4 flex-none fill-none stroke-muted stroke-[1.4]">
            <circle cx="6.6" cy="6.6" r="4.9" />
            <path d="m10.4 10.4 4 4" />
          </svg>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Where to tonight"
            className="h-11 w-full bg-transparent text-[13px] text-fg outline-none placeholder:text-muted"
          />
          {term && (
            <button onClick={() => setTerm('')} className="text-muted">
              ×
            </button>
          )}
        </div>
      </div>

      {searching ? (
        <div className="px-5">
          <SectionHead label={results.loading ? 'Searching' : `${results.data?.length ?? 0} places`} />
          {results.loading && <Spinner />}
          {results.data?.length === 0 && (
            <Empty title="Nothing found" note="Try an area name, or a kind of place — brunch, shisha, rooftop." />
          )}
          {results.data?.map((v) => <VenueRow key={v.id} venue={v} />)}
        </div>
      ) : (
        <>
          {venues.loading && <Spinner label="Loading tonight" />}
          {venues.error && <Empty title="Couldn’t load" note={venues.error} />}

          {hero && <Hero venue={hero} />}

          {areas.data && areas.data.length > 0 && (
            <>
              <SectionHead
                label="By area"
                action={
                  <Link to="/places" className="smallcaps text-[9px] text-muted">
                    All areas
                  </Link>
                }
              />
              <div className="flex gap-3 overflow-x-auto px-5 no-scrollbar">
                {areas.data.map((a) => (
                  <Link key={a.id} to={`/area/${a.slug}`} className="w-[104px] flex-none">
                    <div className="h-[132px] bg-card2">
                      {mediaUrl(a.hero_media_url) && (
                        <img
                          src={mediaUrl(a.hero_media_url)!}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <p className="mt-2 font-display text-[13px] text-fg">{a.name_en}</p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {rest.length > 0 && (
            <>
              <SectionHead label="Open near you" />
              <div className="px-5">
                {rest.slice(0, 6).map((v) => (
                  <VenueRow key={v.id} venue={v} pattern={DEMO_PATTERN.slice(0, 10)} />
                ))}
              </div>
            </>
          )}

          {rest.length > 6 && (
            <>
              <SectionHead label="Also tonight" />
              <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
                {rest.slice(6).map((v) => (
                  <VenueTile key={v.id} venue={v} />
                ))}
              </div>
            </>
          )}
          <div className="h-8" />
        </>
      )}
    </Screen>
  )
}

function Hero({ venue }: { venue: VenueSummary }) {
  const media = (venue.venue_media ?? []).filter((m) => m.media_type === 'photo')
  const img = mediaUrl((media.find((m) => m.is_cover) ?? media[0])?.storage_path)
  return (
    <Link to={`/venue/${venue.slug}`} className="relative mt-4 block h-[420px]">
      <div className="absolute inset-0 bg-card2">
        {img && <img src={img} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="scrim absolute inset-0" />
      <div className="absolute inset-x-5 bottom-6">
        <p className="eyebrow">Tonight in {venue.areas?.name_en}</p>
        <h2 className="mt-2 font-display text-[34px] leading-none text-white">{venue.name_en}</h2>
        <div className="mt-4">
          <Meridian pattern={DEMO_PATTERN} labels={['18:00', 'Tap to see tonight', '01:00']} />
        </div>
      </div>
    </Link>
  )
}
