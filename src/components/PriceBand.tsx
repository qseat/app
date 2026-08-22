/**
 * Price shown as stacked notes rather than dollar signs — QSeat prices in
 * Qatari Riyals, and "$$$" reads as an American import. Filled notes for the
 * band, outlined for the rest, so the scale is legible at a glance.
 */
export function PriceBand({ band, size = 13 }: { band: number | null; size?: number }) {
  if (!band) return null
  return (
    <span className="inline-flex items-center gap-[3px] align-middle" aria-label={`Price band ${band} of 4`}>
      {[1, 2, 3, 4].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 16"
          width={size}
          height={(size * 16) / 24}
          className="block"
          style={{ opacity: n <= band ? 1 : 0.24 }}
        >
          <rect
            x="1"
            y="4.5"
            width="22"
            height="10"
            rx="1.6"
            fill={n <= band ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.2"
          />
          {n <= band ? (
            <circle cx="12" cy="9.5" r="2.4" fill="var(--bg)" />
          ) : (
            <circle cx="12" cy="9.5" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.1" />
          )}
          <path
            d="M4 1.6h16"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity={n <= band ? 0.55 : 1}
          />
        </svg>
      ))}
    </span>
  )
}
