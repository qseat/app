import { useState } from 'react'
import { Sheet } from './Sheet'
import { PriceBand } from './PriceBand'
import { PRICE_BAND_LABEL } from '../lib/format'
import { useI18n } from '../lib/i18n'
import type { Taxonomy } from '../data/types'
import type { VenueFilters } from '../data/queries'

export function FilterSheet({
  open,
  onClose,
  taxonomies,
  value,
  onApply,
}: {
  open: boolean
  onClose: () => void
  taxonomies: { categories: Taxonomy[]; vibes: Taxonomy[]; cuisines: Taxonomy[]; amenities: Taxonomy[] }
  value: VenueFilters
  onApply: (f: VenueFilters) => void
}) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<VenueFilters>(value)

  const toggle = (key: 'categoryIds' | 'amenityIds', id: string) =>
    setDraft((d) => {
      const cur = d[key] ?? []
      return { ...d, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] }
    })

  const toggleBand = (n: number) =>
    setDraft((d) => {
      const cur = d.priceBands ?? []
      return { ...d, priceBands: cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n] }
    })

  return (
    <Sheet open={open} onClose={onClose} title={t('filters')}>
      <div className="px-5 pb-5">
        <Group label="Kind of place">
          {taxonomies.categories.map((c) => (
            <Chip key={c.id} on={(draft.categoryIds ?? []).includes(c.id)} onClick={() => toggle('categoryIds', c.id)}>
              {c.name_en}
            </Chip>
          ))}
        </Group>

        <Group label="Amenities">
          {taxonomies.amenities.slice(0, 14).map((a) => (
            <Chip key={a.id} on={(draft.amenityIds ?? []).includes(a.id)} onClick={() => toggle('amenityIds', a.id)}>
              {a.name_en}
            </Chip>
          ))}
        </Group>

        <Group label="Price">
          {[1, 2, 3, 4].map((n) => (
            <Chip key={n} on={(draft.priceBands ?? []).includes(n)} onClick={() => toggleBand(n)}>
              <span className="flex items-center gap-1.5">
                <PriceBand band={n} size={11} />
                <span className="text-[10.5px] opacity-70">{PRICE_BAND_LABEL[n]}</span>
              </span>
            </Chip>
          ))}
        </Group>

        <div className="mt-7 flex gap-3">
          <button
            className="btn btn-ghost flex-1"
            onClick={() => setDraft({ areaId: value.areaId ?? null })}
          >
            {t('clear')}
          </button>
          <button
            className="btn flex-[2]"
            onClick={() => {
              onApply(draft)
              onClose()
            }}
          >
            {t('apply')}
          </button>
        </div>
      </div>
    </Sheet>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-hair pb-4 pt-5 last:border-b-0">
      <p className="t-meta mb-3 text-[9px] text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`chip ${on ? 'chip-on' : ''}`}
    >
      {children}
    </button>
  )
}
