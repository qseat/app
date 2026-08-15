export function Empty({ title, note }: { title: string; note?: string }) {
  return (
    <div className="px-8 py-16 text-center">
      <p className="t-title text-[24px] text-fg">{title}</p>
      {note && (
        <p className="mx-auto mt-3 max-w-[34ch] text-[13px] leading-relaxed text-muted">{note}</p>
      )}
    </div>
  )
}
