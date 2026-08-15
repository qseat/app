import { Link } from 'react-router-dom'
import { mediaUrl, focalStyle, W } from '../lib/media'
import type { VenueSummary } from '../data/types'
import { Meridian } from './Meridian'
import { FavouriteButton } from './FavouriteButton'

function coverMedia(v: VenueSummary) {
  const media = (v.venue_media ?? []).filter((m) => m.media_type === 'photo')
  return media.find((m) => m.is_cover) ?? media[0] ?? null
}

const band = (n: number | null) => (n ? '$'.repeat(n) : '')

/** Compact list row — image left, detail right. */
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
  const m = coverMedia(venue)
  const img = mediaUrl(m?.storage_path, { width: W.row, height: 400 })
  return (
    <div className="flex gap-4 py-3.5">
      <Link
        to={`/venue/${venue.slug}`}
        className="h-[92px] w-[84px] flex-none overflow-hidden rounded-sm bg-surface2"
      >
        {img && (
          <img
            src={img}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={focalStyle(m?.focal_x, m?.focal_y)}
          />
        )}
      </Link>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/venue/${venue.slug}`} className="min-w-0 flex-1">
            <h4 className="t-title truncate text-[20px] text-fg">{venue.name_en}</h4>
            <p className="t-meta mt-1 truncate">
              {venue.areas?.name_en}
              {venue.price_band ? ` · ${band(venue.price_band)}` : ''}
              {rating ? ` · ★ ${rating.toFixed(1)}` : ''}
            </p>
          </Link>
          <FavouriteButton venueId={venue.id} />
        </div>
        {pattern && pattern.length > 0 && (
          <Link to={`/venue/${venue.slug}`} className="mt-3 block">
            <Meridian pattern={pattern} />
          </Link>
        )}
        {note && <p className="mt-2 text-[10.5px] tracking-[0.08em] text-goldt">{note}</p>}
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
  const m = coverMedia(venue)
  const img = mediaUrl(m?.storage_path, { width: width * 2, height: width * 2.5 })
  return (
    <Link to={`/venue/${venue.slug}`} style={{ width }} className="block">
      <div
        className="relative overflow-hidden rounded-lg bg-surface2"
        style={{ height: width * 1.25 }}
      >
        {img && (
          <img
            src={img}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={focalStyle(m?.focal_x, m?.focal_y)}
          />
        )}
        <div className="scrim-soft absolute inset-0" />
        {note && (
          <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[9.5px] tracking-[0.1em] text-goldsoft backdrop-blur-sm">
            {note}
          </span>
        )}
      </div>
      <p className="t-title mt-2.5 truncate text-[17px] text-fg">{venue.name_en}</p>
      <p className="t-meta mt-0.5 truncate text-[10.5px]">
        {venue.areas?.name_en}
        {venue.price_band ? ` · ${band(venue.price_band)}` : ''}
      </p>
    </Link>
  )
}
