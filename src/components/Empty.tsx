export function Empty({ title, note }: { title: string; note?: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-display text-2xl text-fg">{title}</p>
      {note && <p className="mx-auto mt-3 max-w-[34ch] text-[12.5px] leading-relaxed text-muted">{note}</p>}
    </div>
  )
}
