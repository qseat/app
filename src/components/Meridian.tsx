/**
 * The availability meridian: a gold rule ticked into the evening's slots.
 * Tall tick = open, short = taken. Reads a venue's whole night at a glance.
 */
export function Meridian({
  pattern,
  labels,
}: {
  pattern: boolean[]
  labels?: [string, string, string]
}) {
  if (!pattern.length) return null
  return (
    <div>
      <div className="flex h-4 items-end gap-[3px]">
        {pattern.map((free, i) => (
          <span
            key={i}
            className="flex-1 bg-gold transition-all"
            style={{ height: free ? '15px' : '6px', opacity: free ? 1 : 0.26 }}
          />
        ))}
      </div>
      {labels && (
        <div className="smallcaps flex justify-between pt-2 text-[8.5px] text-muted">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
          <span>{labels[2]}</span>
        </div>
      )}
    </div>
  )
}
