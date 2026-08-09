import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Screen, SectionHead, TopBar } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { fetchVenue } from '../data/queries'
import { mediaUrl } from '../lib/supabase'
import type { VenueSpace } from '../data/types'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const hhmm = (t: string) => t.slice(0, 5)

export function Venue() {
  const { slug = '' } = useParams()
  const v = useAsync(() => fetchVenue(slug), [slug])
  const [shot, setShot] = useState(0)
  const [open, setOpen] = useState<string | null>('hours')

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
  const img = mediaUrl(photos[shot]?.storage_path)
  const spaces = (venue.venue_spaces ?? [])
    .filter((s) => s.is_active !== false)
    .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))
  const hours = (venue.venue_hours ?? []).sort((a, b) => a.day_of_week - b.day_of_week)

  return (
    <Screen nav={<BottomNav />}>
      <div className="relative h-[360px]">
        <div className="absolute inset-0 bg-card2">
          {img && <img src={img} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="scrim absolute inset-0" />
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
          <div className="absolute inset-x-0 bottom-[86px] z-10 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setShot(i)}
                aria-label={`Photo ${i + 1}`}
                className={i === shot ? 'h-1 w-4 bg-white' : 'h-1 w-1 rounded-full bg-white/40'}
              />
            ))}
          </div>
        )}
        <div className="absolute inset-x-5 bottom-5">
          <p className="eyebrow">{venue.areas?.name_en}</p>
          <h1 className="mt-2 font-display text-[36px] leading-none text-white">{venue.name_en}</h1>
          {venue.name_ar && (
            <p className="mt-1 text-[15px] text-white/70" dir="rtl">
              {venue.name_ar}
            </p>
          )}
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

      {venue.description_en && (
        <p className="px-5 pt-5 text-[13px] leading-[1.75] text-fg2">{venue.description_en}</p>
      )}

      {spaces.length > 0 && (
        <>
          <SectionHead label="Choose a room" />
          <div className="flex gap-3 overflow-x-auto px-5 no-scrollbar">
            {spaces.map((s) => (
              <SpaceCard key={s.id} space={s} venueSlug={venue.slug} />
            ))}
          </div>
        </>
      )}

      <div className="px-5 pt-7">
        <Accordion
          id="hours"
          title="Hours"
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
                  {hhmm(h.opens_at)} — {hhmm(h.closes_at)}
                  {h.closes_next_day ? ' ⁺¹' : ''}
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
            title="Where"
            open={open === 'where'}
            onToggle={() => setOpen(open === 'where' ? null : 'where')}
          >
            <p className="text-[12.5px] leading-relaxed text-fg2">{venue.address_en}</p>
          </Accordion>
        )}
      </div>

      {spaces.length > 0 && (
        <Link to={`/book/${venue.slug}`} className="btn mx-5 mt-7 block">
          Reserve a table
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
  const img = mediaUrl(
    ((space.space_media ?? []).find((m) => m.is_cover) ?? space.space_media?.[0])?.storage_path,
  )
  return (
    <Link to={`/book/${venueSlug}?space=${space.id}`} className="w-[132px] flex-none">
      <div className="h-[86px] bg-card2">
        {img && <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <p className="mt-2 font-display text-[13px] text-fg">{space.name_en}</p>
      <p className="smallcaps text-[8.5px] text-muted">
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
    <div className="border-b border-hair2">
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
      <em className="smallcaps not-italic text-[8.5px] text-muted">{label}</em>
    </a>
  )
}
