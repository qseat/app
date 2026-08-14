/**
 * The Hairline Q — a thin circle cut by a straight gold tail. Two primitives
 * crossing once, which is the interface's own divider logic turned into a
 * letter. The tail must cross the ring rather than tuck inside it; that
 * intersection is what stops it reading as a generic circle mark.
 *
 * `weight` thickens the strokes for small sizes — a 1px-logic mark disappears
 * below about 44px, so the small variant is a second drawing, not a scale.
 */
export function Mark({
  size = 28,
  weight,
  className,
}: {
  size?: number
  weight?: number
  className?: string
}) {
  const w = weight ?? (size < 44 ? 3.6 : 2.2)
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth={w} />
      <line
        x1="57"
        y1="57"
        x2="83"
        y2="83"
        stroke="var(--gold)"
        strokeWidth={w + 0.6}
      />
    </svg>
  )
}

/** Mark plus wordmark, for screen headers. */
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Mark size={size} className="text-fg" />
      <span
        className="font-display uppercase text-goldt"
        style={{ fontSize: size * 0.68, letterSpacing: '0.42em', lineHeight: 1 }}
      >
        QSeat
      </span>
    </div>
  )
}
