/**
 * The availability meridian — a ticked rule reading a venue's whole evening at a
 * glance. Tall tick open, short tick taken. Rounded now, and the open ticks glow
 * faintly, so it reads as light rather than as a bar chart.
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
            className="flex-1 rounded-full transition-all duration-300"
            style={{
              height: free ? '15px' : '5px',
              background: free ? 'var(--gold)' : 'var(--faint)',
              boxShadow: free ? '0 0 8px -2px var(--gold-glow)' : 'none',
            }}
          />
        ))}
      </div>
      {labels && (
        <div className="flex justify-between pt-2.5 text-[9.5px] tracking-[0.1em] text-white/55">
          <span>{labels[0]}</span>
          <span className="text-goldsoft">{labels[1]}</span>
          <span>{labels[2]}</span>
        </div>
      )}
    </div>
  )
}
