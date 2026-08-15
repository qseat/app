import { useEffect, useState } from 'react'
import { Mark } from '../components/Logo'

/**
 * Shown while the session resolves. Not a loading spinner with a logo on it —
 * the mark draws itself, which is a beat of intent rather than a wait.
 */
export function Splash() {
  const [lit, setLit] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setLit(true), 120)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-bg">
      {/* a single warm bloom behind the mark, so the black is not flat */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-[1400ms]"
        style={{
          background:
            'radial-gradient(circle, var(--gold-glow) 0%, transparent 62%)',
          opacity: lit ? 1 : 0,
        }}
      />
      <div
        className="relative transition-all duration-[1100ms]"
        style={{
          opacity: lit ? 1 : 0,
          transform: lit ? 'none' : 'scale(0.94)',
          transitionTimingFunction: 'cubic-bezier(.22,1,.36,1)',
        }}
      >
        <Mark size={64} weight={1.6} className="text-fg" />
      </div>
      <p
        className="relative mt-8 t-title text-[15px] uppercase tracking-[0.52em] text-goldsoft transition-all duration-[900ms]"
        style={{
          opacity: lit ? 1 : 0,
          transform: lit ? 'none' : 'translateY(8px)',
          transitionDelay: '340ms',
        }}
      >
        QSeat
      </p>
      <p
        className="absolute bottom-[max(40px,env(safe-area-inset-bottom))] text-[10px] tracking-[0.24em] text-faint transition-opacity duration-700"
        style={{ opacity: lit ? 1 : 0, transitionDelay: '780ms' }}
      >
        RESERVE IN QATAR
      </p>
    </div>
  )
}
