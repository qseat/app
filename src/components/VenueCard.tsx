import { Link } from 'react-router-dom'
import { mediaUrl, focalStyle, W } from '../lib/media'
import type { VenueSummary } from '../data/types'
import { Meridian } from './Meridian'
import { FavouriteButton } from './FavouriteButton'

function coverMedia(v: VenueSummary) {
  const media = (v.venue_media ?? []).filter((m) => m.media_type === 'photo')
  return media.find((m) => m.is_cover) ?? media[0] ?? null
}

const band = (n: number | null) => (n ? '·'.repeat(0) + '$'.repeat(n) : '')

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
    <div className="flex gap-4 border-b border-hair2 py-4">
      <Link to={`/venue/${venue.slug}`} className="h-24 w-[76px] flex-none bg-card2">
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
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/venue/${venue.slug}`} className="min-w-0 flex-1">
            <h4 className="truncate font-display text-xl leading-tight text-fg">{venue.name_en}</h4>
            <p className="smallcaps mt-1 text-[9.5px] text-muted">
              {venue.areas?.name_en}
              {venue.price_band ? ` · ${band(venue.price_band)}` : ''}
              {rating ? ` · ${rating.toFixed(1)}` : ''}
            </p>
          </Link>
          <FavouriteButton venueId={venue.id} />
        </div>
        {pattern && pattern.length > 0 && (
          <Link to={`/venue/${venue.slug}`} className="mt-3 block">
            <Meridian pattern={pattern} />
          </Link>
        )}
        {note && <p className="smallcaps mt-2 text-[8.5px] text-goldt">{note}</p>}
      </div>
    </div>
  )
}

export function VenueTile({ venue }: { venue: VenueSummary }) {
  const m = coverMedia(venue)
  const img = mediaUrl(m?.storage_path, { width: W.tile, height: 570 })
  return (
    <Link to={`/venue/${venue.slug}`} className="w-[150px] flex-none">
      <div className="relative h-[190px] bg-card2">
        {img && (
          <img
            src={img}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={focalStyle(m?.focal_x, m?.focal_y)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
        <div className="absolute inset-x-3 bottom-3">
          <p className="font-display text-[17px] leading-tight text-white">{venue.name_en}</p>
          <p className="smallcaps mt-1 text-[8px] text-white/60">{venue.areas?.name_en}</p>
        </div>
      </div>
    </Link>
  )
}
