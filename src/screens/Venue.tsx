import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Screen, SectionHead, TopBar } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { fetchVenue, fetchRatings, fetchVenueReviews } from '../data/queries'
import { mediaUrl, focalStyle, W } from '../lib/media'
import { useI18n, localised } from '../lib/i18n'
import { FavouriteButton } from '../components/FavouriteButton'
import { clockOf, dateOf } from '../lib/format'
import { openState } from '../lib/hours'
import { PriceBand } from '../components/PriceBand'
import type { Rating, Review, VenueSpace } from '../data/types'
import { useAsync as useAsync2 } from '../lib/useAsync'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function Venue() {
  const { slug = '' } = useParams()
  const { t, lang } = useI18n()
  const v = useAsync(() => fetchVenue(slug), [slug])
  const venueId = v.data?.id ?? null
  const ratings = useAsync2<Record<string, Rating>>(
    () => (venueId ? fetchRatings([venueId]) : Promise.resolve({} as Record<string, Rating>)),
    [venueId],
  )
  const reviews = useAsync2<Review[]>(
    () => (venueId ? fetchVenueReviews(venueId) : Promise.resolve([] as Review[])),
    [venueId],
  )
  const [shot, setShot] = useState(0)
  const galleryRef = useRef<HTMLDivElement | null>(null)

  function onGalleryScroll() {
    const el = galleryRef.current
    if (!el) return
    setShot(Math.round(el.scrollLeft / el.clientWidth))
  }
  const [open, setOpen] = useState<string | null>(null)

  if (v.loading) return <Screen nav={<BottomNav />}><Spinner full label="Loading" /></Screen>
  if (v.error || !v.data)
    return (
      <Screen nav={<BottomNav />}>
        <TopBar />
        <Empty title="Couldn’t load this place" note={v.error ?? undefined} />
      </Screen>
    )

  const venue = v.data
  const photos = (venue.venue_media ?? [])
    .filter((m) => m.media_type === 'photo')
    .sort((a, b) => (a.is_cover ? -1 : 0) - (b.is_cover ? -1 : 0))
  const spaces = (venue.venue_spaces ?? [])
    .filter((s) => s.is_active !== false)
    .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))
  const hours = (venue.venue_hours ?? []).sort((a, b) => a.day_of_week - b.day_of_week)
  const state = openState(venue.venue_hours)

  return (
    <Screen nav={<BottomNav />}>
      <div className="relative h-[400px]">
        {/* A real swipeable deck rather than dots that swap a src — the gesture
            is what people reach for first, and tapping a 4px dot is not it. */}
        <div
          ref={galleryRef}
          onScroll={onGalleryScroll}
          className="absolute inset-0 flex overflow-x-auto overflow-y-hidden"
          style={{
            scrollSnapType: 'x mandatory',
            overscrollBehaviorX: 'contain',
            touchAction: 'pan-x',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {(photos.length ? photos : [null]).map((ph, i) => {
            const src = mediaUrl(ph?.storage_path, { width: W.gallery, height: 1080 })
            return (
              <div
                key={i}
                className="h-full w-full flex-none bg-surface2"
                style={{ scrollSnapAlign: 'center', scrollSnapStop: 'always' }}
              >
                {src && (
                  <img
                    src={src}
                    alt=""
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover"
                    style={focalStyle(ph?.focal_x, ph?.focal_y)}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="scrim pointer-events-none absolute inset-0" />
        <div className="absolute left-5 top-[max(52px,env(safe-area-inset-top))] z-10">
          <Link
            to=".."
            onClick={(e) => {
              e.preventDefault()
              history.back()
            }}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/40"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-white stroke-[1.4]">
              <path d="M10 3 5 8l5 5" />
            </svg>
          </Link>
        </div>
        {photos.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[104px] z-10 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === shot ? 18 : 5,
                  background: i === shot ? '#fff' : 'rgba(255,255,255,.42)',
                }}
              />
            ))}
          </div>
        )}
        <div className="absolute right-5 top-[max(52px,env(safe-area-inset-top))] z-10">
          <FavouriteButton venueId={venue.id} floating />
        </div>
        <div className="absolute inset-x-5 bottom-5">
          <p className="t-eyebrow">{venue.areas?.name_en}</p>
          <h1 className="mt-2 t-title text-[36px] leading-none text-white">
            {localised(lang, venue.name_en, venue.name_ar)}
          </h1>

        </div>
      </div>

      <div className="mt-5 flex border-y border-hair">
        {venue.phone && <Action href={`tel:${venue.phone}`} label="Call" icon="call" />}
        {venue.whatsapp_phone && (
          <Action
            href={`https://wa.me/${venue.whatsapp_phone.replace(/\D/g, '')}`}
            label="Message"
            icon="chat"
          />
        )}
        <Action
          href={`https://maps.google.com/?q=${encodeURIComponent(
            `${venue.name_en} ${venue.areas?.name_en ?? ''} Qatar`,
          )}`}
          label="Route"
          icon="route"
        />
      </div>

      {ratings.data?.[venue.id] && (
        <div className="flex items-baseline gap-3 px-5 pt-6">
          <span className="t-title text-[38px] leading-none text-goldt">
            {ratings.data[venue.id].rating.toFixed(1)}
          </span>
          <span className="t-meta text-[9px] text-muted">
            from {ratings.data[venue.id].review_count} visits
          </span>
        </div>
      )}

      {localised(lang, venue.description_en, venue.description_ar) && (
        <p className="px-5 pt-5 text-[13px] leading-[1.75] text-fg2">
          {localised(lang, venue.description_en, venue.description_ar)}
        </p>
      )}

      {spaces.length > 0 && (
        <>
          <SectionHead label={t('chooseRoom')} />
          <div className="rail">
            {spaces.map((s) => (
              <SpaceCard key={s.id} space={s} venueSlug={venue.slug} />
            ))}
          </div>
        </>
      )}

      <div className="px-5 pt-7">
        <div className="flex items-center justify-between border-b border-hair pb-4">
          <div>
            <p className="t-eyebrow" style={{ color: state.isOpen ? 'var(--gold-text)' : 'var(--muted)' }}>
              {state.isOpen ? 'Open now' : 'Closed'}
            </p>
            <p className="mt-1.5 text-[13px] text-fg">
              {state.today.length === 0
                ? 'Not open today'
                : state.isOpen
                  ? `Closing at ${clockOf(state.closesAt!)}`
                  : `Opens today at ${clockOf(state.opensAt!)}`}
            </p>
          </div>
          {venue.price_band && (
            <span className="text-goldt">
              <PriceBand band={venue.price_band} size={14} />
            </span>
          )}
        </div>

        <Accordion
          id="hours"
          title={t('hours')}
          open={open === 'hours'}
          onToggle={() => setOpen(open === 'hours' ? null : 'hours')}
        >
          {hours.length === 0 ? (
            <p className="text-[12px] text-muted">Not published.</p>
          ) : (
            hours.map((h, i) => (
              <div key={i} className="flex justify-between py-1 text-[12.5px]">
                <span className="text-muted">{DAYS[h.day_of_week]}</span>
                <span className="text-fg">
                  {clockOf(h.opens_at)} — {clockOf(h.closes_at)}
                  {h.closes_next_day ? ' \u207a\u00b9' : ''}
                </span>
              </div>
            ))
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Bookable times can differ from opening hours.
          </p>
        </Accordion>
        {venue.address_en && (
          <Accordion
            id="where"
            title={t('where')}
            open={open === 'where'}
            onToggle={() => setOpen(open === 'where' ? null : 'where')}
          >
            <p className="text-[12.5px] leading-relaxed text-fg2">{venue.address_en}</p>
          </Accordion>
        )}
      </div>

      {(reviews.data?.length ?? 0) > 0 && (
        <>
          <SectionHead label={t('reviews')} />
          <div className="px-5">
            {reviews.data!.slice(0, 4).map((r) => (
              <div key={r.id} className="border-b border-hair py-4">
                <div className="flex items-baseline gap-2">
                  <span className="t-title text-[20px] text-goldt">{r.overall}</span>
                  <span className="t-meta text-[8.5px] text-muted">{dateOf(r.created_at)}</span>
                </div>
                {r.body && (
                  <p className="mt-2 t-title text-[15px] italic leading-relaxed text-fg2">
                    {r.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {spaces.length > 0 && (
        <Link to={`/book/${venue.slug}`} className="btn mx-5 mt-7 block">
          {t('reserve')}
        </Link>
      )}
      <p className="px-8 pt-4 text-center text-[10.5px] leading-relaxed text-muted">
        The house replies to your request, usually within the hour.
      </p>
      <div className="h-10" />
    </Screen>
  )
}

function SpaceCard({ space, venueSlug }: { space: VenueSpace; venueSlug: string }) {
  const sm = (space.space_media ?? []).find((m) => m.is_cover) ?? space.space_media?.[0]
  const img = mediaUrl(sm?.storage_path, { width: W.tile, height: 260 })
  return (
    <Link to={`/book/${venueSlug}?space=${space.id}`} className="w-[132px] flex-none">
      <div className="h-[86px] bg-surface2">
        {img && (
          <img
            src={img}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={focalStyle(sm?.focal_x, sm?.focal_y)}
          />
        )}
      </div>
      <p className="mt-2 t-title text-[13px] text-fg">{space.name_en}</p>
      <p className="t-meta text-[8.5px] text-muted">
        Seats {space.min_party}–{space.max_party}
      </p>
    </Link>
  )
}

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  id: string
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-hair">
      <button onClick={onToggle} className="flex w-full items-center justify-between py-4">
        <span className="text-[13px] text-fg">{title}</span>
        <span
          className="text-[15px] text-goldt transition-transform"
          style={{ transform: open ? 'rotate(45deg)' : 'none' }}
        >
          +
        </span>
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  )
}

const ICONS: Record<string, React.ReactNode> = {
  call: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />,
  chat: <path d="M4 5h16v11H9l-5 4V5Z" />,
  route: (
    <>
      <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3Z" />
      <path d="M9 4v13M15 7v13" />
    </>
  ),
}

function Action({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className="flex-1 border-r border-hair py-4 text-center last:border-r-0"
    >
      <svg viewBox="0 0 24 24" className="mx-auto mb-2 h-4 w-4 fill-none stroke-goldt stroke-[1.3]">
        {ICONS[icon]}
      </svg>
      <em className="t-meta not-italic text-[8.5px] text-muted">{label}</em>
    </a>
  )
}
