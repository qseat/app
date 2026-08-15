import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Screen, SectionHead } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { VenueRow, VenueTile } from '../components/VenueCard'
import { Meridian } from '../components/Meridian'
import { SkeletonRow, SkeletonTile } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { FilterSheet } from '../components/FilterSheet'
import { FavouriteButton } from '../components/FavouriteButton'
import { Wordmark } from '../components/Logo'
import { useAsync } from '../lib/useAsync'
import {
  fetchAreas,
  fetchAvailabilitySummary,
  fetchCollections,
  fetchRatings,
  fetchTaxonomies,
  fetchTrendingTerms,
  fetchVenuesFiltered,
  searchVenues,
  type VenueFilters,
} from '../data/queries'
import { mediaUrl, focalStyle, W } from '../lib/media'
import { qatarDateKey, reasonLabel, timeOf } from '../lib/format'
import { useI18n, localised } from '../lib/i18n'
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
  const availability = useAsync(() => fetchAvailabilitySummary(ids, today, 2), [ids.join(','), today])
  const ratings = useAsync(() => fetchRatings(ids), [ids.join(',')])
  const trending = useAsync(fetchTrendingTerms, [])
  const collections = useAsync(fetchCollections, [])
  const results = useAsync(
    () => (term.trim().length > 1 ? searchVenues(term.trim()) : Promise.resolve(null)),
    [term],
  )

  const searching = term.trim().length > 1
  const list = venues.data ?? []
  const hero = list[0] ?? null
  const rest = list.slice(1)
  const filterCount =
    (filters.categoryIds?.length ?? 0) +
    (filters.amenityIds?.length ?? 0) +
    (filters.priceBands?.length ?? 0)

  const availableNow = rest.filter((v) => (availability.data?.[v.id]?.open_slots ?? 0) > 0)

  return (
    <Screen nav={<BottomNav />}>
      {/* header */}
      <div className="glass sticky top-0 z-40 px-5 pb-3 pt-[max(52px,env(safe-area-inset-top))]">
        <div className="mb-3.5 flex justify-center">
          <Wordmark size={19} />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-12 flex-1 items-center gap-3 rounded-lg bg-surface px-4">
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] flex-none fill-none stroke-muted stroke-[1.5]"
              strokeLinecap="round"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 4 4" />
            </svg>
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-transparent text-[14.5px] text-fg outline-none placeholder:text-faint"
            />
            {term && (
              <button onClick={() => setTerm('')} className="text-lg text-muted">
                ×
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(true)}
            aria-label={t('filters')}
            className="relative grid h-12 w-12 flex-none place-items-center rounded-lg bg-surface transition-transform active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] fill-none stroke-[1.5]"
              stroke={filterCount ? 'var(--gold)' : 'var(--muted)'}
              strokeLinecap="round"
            >
              <path d="M4 7h16M7 12h10M10 17h4" />
            </svg>
            {filterCount > 0 && (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold" />
            )}
          </button>
        </div>
      </div>

      {searching ? (
        <div className="px-5 pt-2">
          <SectionHead label={results.loading ? 'Searching' : `${results.data?.length ?? 0} places`} />
          {results.loading && [0, 1, 2].map((i) => <SkeletonRow key={i} />)}
          {results.data?.length === 0 && (
            <Empty
              title="Nothing found"
              note="Try an area, or a kind of place — brunch, shisha, rooftop."
            />
          )}
          {results.data?.map((v) => <VenueRow key={v.id} venue={v} />)}
        </div>
      ) : (
        <>
          {trending.data && trending.data.length > 0 && (
            <div className="rail rail-snap pt-4">
              {trending.data.map((x) => (
                <button key={x} onClick={() => setTerm(x)} className="chip">
                  {x}
                </button>
              ))}
            </div>
          )}

          {venues.loading && (
            <div className="px-5 pt-5">
              <div className="skeleton h-[460px] rounded-xl" />
            </div>
          )}

          {venues.error && <Empty title="Couldn't load tonight" note={venues.error} />}

          {hero && (
            <div className="rise px-5 pt-5">
              <Hero venue={hero} summary={availability.data?.[hero.id] ?? null} lang={lang} />
            </div>
          )}

          {availableNow.length > 0 && (
            <>
              <SectionHead label="Free tonight" />
              <div className="rail">
                {availableNow.slice(0, 8).map((v) => (
                  <VenueTile
                    key={v.id}
                    venue={v}
                    note={
                      availability.data?.[v.id]?.next_slot
                        ? `from ${timeOf(availability.data[v.id].next_slot!)}`
                        : undefined
                    }
                  />
                ))}
              </div>
            </>
          )}

          {areas.data && areas.data.length > 0 && (
            <>
              <SectionHead
                label={t('byArea')}
                action={
                  <Link to="/places" className="text-[10.5px] tracking-[0.1em] text-muted">
                    {t('allAreas')} ›
                  </Link>
                }
              />
              <div className="rail">
                {areas.data.map((a) => {
                  const img = mediaUrl(a.hero_media_url, { width: 260, height: 340 }, 'area')
                  return (
                    <Link key={a.id} to={`/area/${a.slug}`} className="w-[124px]">
                      <div className="relative h-[158px] overflow-hidden rounded-lg bg-surface2">
                        {img && (
                          <img
                            src={img}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                            style={focalStyle(a.hero_focal_x, a.hero_focal_y)}
                          />
                        )}
                        <div className="scrim-soft absolute inset-0" />
                        <p className="t-title absolute inset-x-3 bottom-2.5 text-[15px] leading-tight text-white">
                          {localised(lang, a.name_en, a.name_ar)}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}

          {collections.data && collections.data.length > 0 && (
            <>
              <SectionHead label="Collections" />
              <div className="rail">
                {collections.data.map((c) => {
                  const img = mediaUrl(c.cover_path, { width: 560, height: 340 })
                  return (
                    <Link key={c.id} to={`/collection/${c.slug}`} className="w-[264px]">
                      <div className="relative h-[158px] overflow-hidden rounded-lg bg-surface2">
                        {img && (
                          <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                        )}
                        <div className="scrim absolute inset-0" />
                        <div className="absolute inset-x-4 bottom-3.5">
                          <p className="t-title text-[19px] leading-tight text-white">
                            {localised(lang, c.title_en, c.title_ar)}
                          </p>
                          {c.subtitle_en && (
                            <p className="mt-1 truncate text-[11px] text-white/65">
                              {c.subtitle_en}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}

          {rest.length > 0 && (
            <>
              <SectionHead label={t('openNear')} />
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

          {venues.loading && (
            <div className="rail pt-8">
              {[0, 1, 2].map((i) => <SkeletonTile key={i} />)}
            </div>
          )}

          <div className="h-10" />
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
  const pick = media.find((m) => m.is_cover) ?? media[0]
  const img = mediaUrl(pick?.storage_path, { width: W.hero, height: 1180 })
  const open = summary?.open_slots ?? 0

  return (
    <div className="relative h-[460px] overflow-hidden rounded-xl bg-surface2 shadow-lg">
      <Link to={`/venue/${venue.slug}`} className="absolute inset-0 block">
        {img && (
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover"
            style={focalStyle(pick?.focal_x, pick?.focal_y)}
          />
        )}
        <div className="scrim absolute inset-0" />
      </Link>

      <div className="absolute right-4 top-4 z-10">
        <FavouriteButton venueId={venue.id} floating />
      </div>

      <Link to={`/venue/${venue.slug}`} className="absolute inset-x-5 bottom-6 block">
        <p className="text-[10px] tracking-[0.26em] text-goldsoft">
          TONIGHT IN {venue.areas?.name_en?.toUpperCase()}
        </p>
        <h2 className="t-display mt-2.5 text-[38px] text-white">
          {localised(lang, venue.name_en, venue.name_ar)}
        </h2>
        {summary?.pattern && (
          <div className="mt-5">
            <Meridian
              pattern={summary.pattern}
              labels={[
                summary.next_slot ? timeOf(summary.next_slot) : '',
                open > 0
                  ? `${open} ${open === 1 ? 'table' : 'tables'} open`
                  : reasonLabel(summary.reason),
                '',
              ]}
            />
          </div>
        )}
      </Link>
    </div>
  )
}
