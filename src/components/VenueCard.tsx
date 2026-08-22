import { Link } from 'react-router-dom'
import { mediaUrl, focalStyle, W } from '../lib/media'
import type { VenueSummary } from '../data/types'
import { Meridian } from './Meridian'
import { FavouriteButton } from './FavouriteButton'
import { PriceBand } from './PriceBand'
import { openState } from '../lib/hours'
import { clockOf } from '../lib/format'
import { useI18n, localised } from '../lib/i18n'

function coverMedia(v: VenueSummary) {
  const media = (v.venue_media ?? []).filter((m) => m.media_type === 'photo')
  return media.find((m) => m.is_cover) ?? media[0] ?? null
}

function ClosedBadge() {
  return (
    <span className="rounded-sm bg-black/65 px-2 py-1 text-[9.5px] uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">
      Closed
    </span>
  )
}

/** Compact list row. */
export function VenueRow({
  venue,
  pattern,
  rating,
  note,
}: {
  venue: VenueSummary
  pattern?: boolean[]
  rating?: number
  note?: string
}) {
  const { lang } = useI18n()
  const m = coverMedia(venue)
  const img = mediaUrl(m?.storage_path, { width: W.row, height: 400 })
  const state = openState(venue.venue_hours)

  return (
    <div className="flex gap-4 py-3.5" style={{ opacity: state.isOpen ? 1 : 0.55 }}>
      <Link
        to={`/venue/${venue.slug}`}
        className="relative h-[92px] w-[84px] flex-none overflow-hidden rounded-sm bg-surface2"
      >
        {img && (
          <img
            src={img}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={{
              ...focalStyle(m?.focal_x, m?.focal_y),
              filter: state.isOpen ? undefined : 'grayscale(0.7)',
            }}
          />
        )}
      </Link>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/venue/${venue.slug}`} className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="t-title truncate text-[19px] text-fg">
                {localised(lang, venue.name_en, venue.name_ar)}
              </h4>
              {!state.isOpen && <ClosedBadge />}
            </div>
            <p className="t-meta mt-1 flex items-center gap-2 truncate">
              <span>{venue.areas?.name_en}</span>
              {venue.price_band && (
                <span className="text-goldt">
                  <PriceBand band={venue.price_band} size={11} />
                </span>
              )}
              {rating ? <span>★ {rating.toFixed(1)}</span> : null}
            </p>
          </Link>
          <FavouriteButton venueId={venue.id} />
        </div>
        {state.isOpen && pattern && pattern.length > 0 && (
          <Link to={`/venue/${venue.slug}`} className="mt-3 block">
            <Meridian pattern={pattern} />
          </Link>
        )}
        {state.isOpen
          ? note && <p className="mt-2 text-[10.5px] tracking-[0.06em] text-goldt">{note}</p>
          : state.opensAt && (
              <p className="t-meta mt-2 text-[10.5px]">Opens {clockOf(state.opensAt)}</p>
            )}
      </div>
    </div>
  )
}

/** Portrait card for a horizontal rail. */
export function VenueTile({
  venue,
  width = 168,
  note,
}: {
  venue: VenueSummary
  width?: number
  note?: string
}) {
  const { lang } = useI18n()
  const m = coverMedia(venue)
  const img = mediaUrl(m?.storage_path, { width: width * 2, height: width * 2.5 })
  const state = openState(venue.venue_hours)

  return (
    <Link
      to={`/venue/${venue.slug}`}
      style={{ width, opacity: state.isOpen ? 1 : 0.6 }}
      className="block"
    >
      <div className="relative overflow-hidden rounded-lg bg-surface2" style={{ height: width * 1.25 }}>
        {img && (
          <img
            src={img}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={{
              ...focalStyle(m?.focal_x, m?.focal_y),
              filter: state.isOpen ? undefined : 'grayscale(0.7)',
            }}
          />
        )}
        <div className="scrim-soft absolute inset-0" />
        {!state.isOpen ? (
          <span className="absolute left-3 top-3">
            <ClosedBadge />
          </span>
        ) : (
          note && (
            <span className="absolute left-3 top-3 rounded-sm bg-black/55 px-2.5 py-1 text-[9.5px] tracking-[0.08em] text-goldsoft backdrop-blur-sm">
              {note}
            </span>
          )
        )}
      </div>
      <p className="t-title mt-2.5 truncate text-[16px] text-fg">
        {localised(lang, venue.name_en, venue.name_ar)}
      </p>
      <p className="t-meta mt-0.5 flex items-center gap-1.5 truncate text-[10.5px]">
        <span className="truncate">{venue.areas?.name_en}</span>
        {venue.price_band && (
          <span className="text-goldt">
            <PriceBand band={venue.price_band} size={10} />
          </span>
        )}
      </p>
    </Link>
  )
}

/**
 * Near-full-width editorial card, for an area's venue list. The photograph is
 * the content here — a small thumbnail beside text tells you nothing about a
 * room you are deciding whether to sit in.
 */
export function VenuePlate({ venue, note }: { venue: VenueSummary; note?: string }) {
  const { lang } = useI18n()
  const m = coverMedia(venue)
  const img = mediaUrl(m?.storage_path, { width: 900, height: 660 })
  const state = openState(venue.venue_hours)

  return (
    <Link
      to={`/venue/${venue.slug}`}
      className="relative block overflow-hidden rounded-lg bg-surface2"
      style={{ height: 232, opacity: state.isOpen ? 1 : 0.62 }}
    >
      {img && (
        <img
          src={img}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          style={{
            ...focalStyle(m?.focal_x, m?.focal_y),
            filter: state.isOpen ? undefined : 'grayscale(0.7)',
          }}
        />
      )}
      <div className="scrim absolute inset-0" />

      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
        {!state.isOpen && <ClosedBadge />}
        <FavouriteButton venueId={venue.id} floating />
      </div>

      <div className="absolute inset-x-4 bottom-4">
        <h4 className="t-title text-[24px] leading-tight text-white">
          {localised(lang, venue.name_en, venue.name_ar)}
        </h4>
        <p className="mt-1.5 flex items-center gap-2 text-[11.5px] text-white/70">
          <span>{venue.areas?.name_en}</span>
          {venue.price_band && (
            <span className="text-goldsoft">
              <PriceBand band={venue.price_band} size={11} />
            </span>
          )}
        </p>
        {state.isOpen
          ? note && <p className="mt-2 text-[11px] tracking-[0.06em] text-goldsoft">{note}</p>
          : state.opensAt && (
              <p className="mt-2 text-[11px] text-white/60">Opens {clockOf(state.opensAt)}</p>
            )}
      </div>
    </Link>
  )
}
