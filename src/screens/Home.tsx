import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Screen, SectionHead } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { VenueRow, VenueTile } from '../components/VenueCard'
import { Meridian } from '../components/Meridian'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import {
  fetchAreas,
  fetchAvailabilitySummary,
  fetchRatings,
  fetchTaxonomies,
  fetchVenuesFiltered,
  searchVenues,
  type VenueFilters,
} from '../data/queries'
import { mediaUrl } from '../lib/supabase'
import { qatarDateKey, reasonLabel, timeOf } from '../lib/format'
import { useI18n, localised } from '../lib/i18n'
import { FilterSheet } from '../components/FilterSheet'
import { FavouriteButton } from '../components/FavouriteButton'
import type { AvailabilitySummary, VenueSummary } from '../data/types'

export function Home() {
  const { t, lang } = useI18n()
  const [term, setTerm] = useState('')
  const [filters, setFilters] = useState<VenueFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const today = useMemo(() => qatarDateKey(new Date()), [])

  const areas = useAsync(fetchAreas, [])
  const taxonomies = useAsync(fetchTaxonomies, [])
  const venues = useAsync(() => fetchVenuesFiltered(filters), [JSON.stringify(filters)])
  const ids = useMemo(() => (venues.data ?? []).map((v) => v.id), [venues.data])
  const availability = useAsync(
    () => fetchAvailabilitySummary(ids, today, 2),
    [ids.join(','), today],
  )
  const ratings = useAsync(() => fetchRatings(ids), [ids.join(',')])
  const activeFilterCount =
    (filters.categoryIds?.length ?? 0) +
    (filters.amenityIds?.length ?? 0) +
    (filters.priceBands?.length ?? 0)
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
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShowFilters(true)}
            className={`smallcaps h-9 flex-1 border text-[9.5px] ${
              activeFilterCount ? 'border-gold text-goldt' : 'border-hair2 text-muted'
            }`}
          >
            {t('filters')}
            {activeFilterCount ? ` · ${activeFilterCount}` : ''}
          </button>
          <Link
            to="/map"
            className="smallcaps grid h-9 flex-1 place-items-center border border-hair2 text-[9.5px] text-muted"
          >
            {t('map')}
          </Link>
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

          {hero && <Hero venue={hero} summary={availability.data?.[hero.id] ?? null} lang={lang} />}

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
                {rest.slice(0, 8).map((v) => (
                  <VenueRow
                    key={v.id}
                    venue={v}
                    pattern={availability.data?.[v.id]?.pattern ?? undefined}
                    rating={ratings.data?.[v.id]?.rating}
                    note={
                      availability.data?.[v.id]
                        ? availability.data[v.id].open_slots > 0
                          ? `From ${timeOf(availability.data[v.id].next_slot!)}`
                          : reasonLabel(availability.data[v.id].reason)
                        : undefined
                    }
                  />
                ))}
              </div>
            </>
          )}

          {rest.length > 8 && (
            <>
              <SectionHead label={t('alsoTonight')} />
              <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
                {rest.slice(8).map((v) => (
                  <VenueTile key={v.id} venue={v} />
                ))}
              </div>
            </>
          )}
          <div className="h-8" />
        </>
      )}

      {taxonomies.data && (
        <FilterSheet
          open={showFilters}
          onClose={() => setShowFilters(false)}
          taxonomies={taxonomies.data}
          value={filters}
          onApply={setFilters}
        />
      )}
    </Screen>
  )
}

function Hero({
  venue,
  summary,
  lang,
}: {
  venue: VenueSummary
  summary: AvailabilitySummary | null
  lang: 'en' | 'ar'
}) {
  const media = (venue.venue_media ?? []).filter((m) => m.media_type === 'photo')
  const img = mediaUrl((media.find((m) => m.is_cover) ?? media[0])?.storage_path)
  const open = summary?.open_slots ?? 0
  return (
    <div className="relative mt-4 h-[420px]">
      <Link to={`/venue/${venue.slug}`} className="absolute inset-0 block">
        <div className="absolute inset-0 bg-card2">
          {img && <img src={img} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="scrim absolute inset-0" />
      </Link>
      <div className="absolute right-4 top-4 z-10">
        <FavouriteButton venueId={venue.id} floating />
      </div>
      <Link to={`/venue/${venue.slug}`} className="absolute inset-x-5 bottom-6 block">
        <p className="eyebrow">Tonight in {venue.areas?.name_en}</p>
        <h2 className="mt-2 font-display text-[34px] leading-none text-white">
          {localised(lang, venue.name_en, venue.name_ar)}
        </h2>
        {summary?.pattern && (
          <div className="mt-4">
            <Meridian
              pattern={summary.pattern}
              labels={[
                summary.next_slot ? timeOf(summary.next_slot) : '',
                open > 0 ? `${open} ${open === 1 ? 'table' : 'tables'} open` : reasonLabel(summary.reason),
                '',
              ]}
            />
          </div>
        )}
      </Link>
    </div>
  )
}
