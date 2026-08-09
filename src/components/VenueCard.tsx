import { Link } from 'react-router-dom'
import { mediaUrl } from '../lib/supabase'
import type { VenueSummary } from '../data/types'
import { Meridian } from './Meridian'

function cover(v: VenueSummary) {
  const media = (v.venue_media ?? []).filter((m) => m.media_type === 'photo')
  const pick = media.find((m) => m.is_cover) ?? media[0]
  return mediaUrl(pick?.storage_path)
}

const band = (n: number | null) => (n ? '·'.repeat(0) + '$'.repeat(n) : '')

export function VenueRow({ venue, pattern }: { venue: VenueSummary; pattern?: boolean[] }) {
  const img = cover(venue)
  return (
    <Link to={`/venue/${venue.slug}`} className="flex gap-4 border-b border-hair2 py-4">
      <div className="h-24 w-[76px] flex-none bg-card2">
        {img && <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-display text-xl leading-tight text-fg">{venue.name_en}</h4>
        <p className="smallcaps mt-1 text-[9.5px] text-muted">
          {venue.areas?.name_en}
          {venue.price_band ? ` · ${band(venue.price_band)}` : ''}
        </p>
        {pattern && pattern.length > 0 && (
          <div className="mt-3">
            <Meridian pattern={pattern} />
          </div>
        )}
      </div>
    </Link>
  )
}

export function VenueTile({ venue }: { venue: VenueSummary }) {
  const img = cover(venue)
  return (
    <Link to={`/venue/${venue.slug}`} className="w-[150px] flex-none">
      <div className="relative h-[190px] bg-card2">
        {img && <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
        <div className="absolute inset-x-3 bottom-3">
          <p className="font-display text-[17px] leading-tight text-white">{venue.name_en}</p>
          <p className="smallcaps mt-1 text-[8px] text-white/60">{venue.areas?.name_en}</p>
        </div>
      </div>
    </Link>
  )
}
