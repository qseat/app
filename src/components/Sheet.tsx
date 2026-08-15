import type { ReactNode } from 'react'
import { useEffect } from 'react'

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />
      <div
        className="rise relative z-10 w-full max-w-[520px] bg-surface pb-[max(20px,env(safe-area-inset-bottom))] shadow-lg"
        style={{ borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)' }}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-surface3" />
        </div>
        <div className="flex items-center justify-between px-6 pb-3 pt-4">
          <p className="t-title text-[19px] text-fg">{title}</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface2 text-lg text-muted"
          >
            ×
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto no-scrollbar">{children}</div>
      </div>
    </div>
  )
}
