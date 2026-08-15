export function Spinner({ full = false, label }: { full?: boolean; label?: string }) {
  return (
    <div
      className={
        full
          ? 'flex h-full min-h-[60vh] flex-col items-center justify-center gap-4'
          : 'flex flex-col items-center justify-center gap-4 py-16'
      }
    >
      <span
        className="block h-7 w-7 animate-spin rounded-full border-2 border-transparent"
        style={{ borderTopColor: 'var(--gold)', borderRightColor: 'var(--hair-strong)' }}
      />
      {label && <span className="t-meta text-[11px]">{label}</span>}
    </div>
  )
}

/** Card-shaped placeholder — a slow screen keeps its shape instead of collapsing. */
export function SkeletonRow() {
  return (
    <div className="flex gap-4 py-3.5">
      <div className="skeleton h-[92px] w-[84px] flex-none rounded-sm" />
      <div className="flex-1 py-1">
        <div className="skeleton h-5 w-2/3 rounded-full" />
        <div className="skeleton mt-2.5 h-3 w-1/3 rounded-full" />
        <div className="skeleton mt-4 h-3.5 w-full rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonTile({ width = 168 }: { width?: number }) {
  return (
    <div style={{ width }}>
      <div className="skeleton rounded-lg" style={{ height: width * 1.25 }} />
      <div className="skeleton mt-2.5 h-4 w-3/4 rounded-full" />
    </div>
  )
}
