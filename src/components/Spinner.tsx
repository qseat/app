export function Spinner({ full = false, label }: { full?: boolean; label?: string }) {
  return (
    <div
      className={
        full
          ? 'flex h-full min-h-[60vh] flex-col items-center justify-center gap-4'
          : 'flex flex-col items-center justify-center gap-4 py-14'
      }
    >
      <span className="block h-6 w-6 animate-spin border border-hair border-t-gold" />
      {label && <span className="smallcaps text-muted">{label}</span>}
    </div>
  )
}
