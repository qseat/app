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
      <div className="fade-up relative z-10 w-full max-w-[520px] border-t border-hair bg-bg pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between border-b border-hair2 px-5 py-4">
          <p className="smallcaps text-goldt">{title}</p>
          <button onClick={onClose} className="text-lg text-muted">
            ×
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto no-scrollbar">{children}</div>
      </div>
    </div>
  )
}
