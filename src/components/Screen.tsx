import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export function Screen({ children, nav }: { children: ReactNode; nav?: ReactNode }) {
  return (
    <div className="mx-auto flex h-full max-w-[520px] flex-col bg-bg">
      <div className="scroll-y flex-1">{children}</div>
      {nav}
    </div>
  )
}

export function TopBar({ title, action }: { title?: string; action?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="glass sticky top-0 z-40 flex items-center gap-3 px-5 pb-3.5 pt-[max(22px,env(safe-area-inset-top))]">
      <button
        onClick={() => nav(-1)}
        aria-label="Back"
        className="grid h-10 w-10 flex-none place-items-center rounded-full bg-surface2 transition-transform active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px] fill-none stroke-fg stroke-[1.6]"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 5 8 12l6.5 7" />
        </svg>
      </button>
      {title && <p className="t-title flex-1 truncate text-[19px] text-fg">{title}</p>}
      {action}
    </div>
  )
}

export function SectionHead({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between px-5 pb-3 pt-8">
      <p className="t-t-eyebrow">{label}</p>
      {action}
    </div>
  )
}
