import { NavLink, useLocation } from 'react-router-dom'

/**
 * Icons only, no labels. The active tab fills rather than changing colour —
 * a filled glyph reads at a glance where a tinted outline does not, and losing
 * the labels buys back the vertical space that made the bar feel heavy.
 *
 * Each icon is drawn twice: an outline path for rest, a solid path for active.
 * Scaling a stroke to imply weight looks like a rendering artefact.
 */
const Outline: Record<string, JSX.Element> = {
  home: <path d="M4.6 10.4 12 4.2l7.4 6.2v8a1.4 1.4 0 0 1-1.4 1.4h-3.7v-5.5H9.7v5.5H6a1.4 1.4 0 0 1-1.4-1.4Z" />,
  places: (
    <>
      <path d="M12 20.4s6.5-5.3 6.5-10.2a6.5 6.5 0 1 0-13 0c0 4.9 6.5 10.2 6.5 10.2Z" />
      <circle cx="12" cy="10.1" r="2.3" />
    </>
  ),
  qr: (
    <>
      <path d="M4.6 8.6v-3a1 1 0 0 1 1-1h3M19.4 8.6v-3a1 1 0 0 0-1-1h-3M4.6 15.4v3a1 1 0 0 0 1 1h3M19.4 15.4v3a1 1 0 0 1-1 1h-3" />
      <rect x="8.5" y="8.5" width="3" height="3" rx=".7" />
      <rect x="12.5" y="8.5" width="3" height="3" rx=".7" />
      <rect x="8.5" y="12.5" width="3" height="3" rx=".7" />
      <rect x="12.5" y="12.5" width="3" height="3" rx=".7" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8.6a6 6 0 1 0-12 0c0 5.6-2 6.6-2 6.6h16s-2-1-2-6.6" />
      <path d="M10.4 19.2a2 2 0 0 0 3.2 0" />
    </>
  ),
  me: (
    <>
      <circle cx="12" cy="8.2" r="3.4" />
      <path d="M5.6 20.4a6.4 6.4 0 0 1 12.8 0" />
    </>
  ),
}

const Solid: Record<string, JSX.Element> = {
  home: <path d="M12 3.6 3.8 10.5V19a1.6 1.6 0 0 0 1.6 1.6h4.1v-5.9h5v5.9h4.1A1.6 1.6 0 0 0 20.2 19v-8.5Z" />,
  places: (
    <path d="M12 21.2s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Zm0-8.6a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
  ),
  qr: (
    <path d="M4.2 4.2h5.6v5.6H4.2Zm1.8 1.8v2h2v-2Zm8.2-1.8h5.6v5.6h-5.6Zm1.8 1.8v2h2v-2ZM4.2 14.2h5.6v5.6H4.2Zm1.8 1.8v2h2v-2Zm8.2-1.8h2.2v2.2h-2.2Zm3.4 0h2.2v2.2h-2.2Zm-3.4 3.4h2.2v2.2h-2.2Zm3.4 0h2.2v2.2h-2.2Z" />
  ),
  bell: (
    <path d="M12 2.4a6 6 0 0 0-6 6.2c0 5.2-2 6-2 6h16s-2-.8-2-6a6 6 0 0 0-6-6.2Zm-1.6 17.2a2 2 0 0 0 3.2 0Z" />
  ),
  me: <path d="M12 12a3.9 3.9 0 1 0 0-7.8A3.9 3.9 0 0 0 12 12Zm0 1.6c-4 0-7 2.6-7 5.6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1c0-3-3-5.6-7-5.6Z" />,
}

const tabs = [
  { to: '/', key: 'home', label: 'Home' },
  { to: '/places', key: 'places', label: 'Places' },
  { to: '/checkin', key: 'qr', label: 'Check in' },
  { to: '/activity', key: 'bell', label: 'Alerts' },
  { to: '/me', key: 'me', label: 'Profile' },
] as const

export function BottomNav({ unread = 0 }: { unread?: number }) {
  const { pathname } = useLocation()

  return (
    <nav className="glass sticky bottom-0 z-50 border-t border-hair">
      <div className="mx-auto flex max-w-[520px] items-center justify-around px-3 pb-[max(16px,env(safe-area-inset-bottom))] pt-3.5">
        {tabs.map((tab) => {
          const active = tab.to === '/' ? pathname === '/' : pathname.startsWith(tab.to)
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className="relative grid h-11 w-11 place-items-center transition-transform active:scale-90"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[25px] w-[25px] transition-colors duration-200"
                fill={active ? 'var(--gold)' : 'none'}
                stroke={active ? 'none' : 'var(--muted)'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {active ? Solid[tab.key] : Outline[tab.key]}
              </svg>
              {tab.key === 'bell' && unread > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-gold px-1 text-[9px] font-medium text-[#14110a]">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
