import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

/** Mobile-first frame. Centred and capped so it stays app-like on a desktop. */
export function Screen({ children, nav }: { children: ReactNode; nav?: ReactNode }) {
  return (
    <div className="mx-auto flex h-full max-w-[520px] flex-col bg-bg">
      <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
      {nav}
    </div>
  )
}

export function TopBar({ title, action }: { title?: string; action?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="sticky top-0 z-40 flex items-center gap-4 border-b border-hair2 bg-bg/90 px-5 pb-4 pt-[max(20px,env(safe-area-inset-top))] backdrop-blur-xl">
      <button
        onClick={() => nav(-1)}
        aria-label="Back"
        className="grid h-9 w-9 flex-none place-items-center rounded-full border border-hair"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-fg stroke-[1.4]">
          <path d="M10 3 5 8l5 5" />
        </svg>
      </button>
      {title && <p className="smallcaps flex-1 truncate text-fg">{title}</p>}
      {action}
    </div>
  )
}

export function SectionHead({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between px-5 pb-2 pt-7">
      <p className="eyebrow">{label}</p>
      {action}
    </div>
  )
}
