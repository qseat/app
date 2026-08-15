import { NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

/* Icons at 1.4 stroke on a 24 grid, rounded joins — softer than the original
   1.3 butt-capped set, which read as technical rather than considered. */
const Icon = {
  home: (
    <>
      <path d="M4.5 10.5 12 4l7.5 6.5v8.2a1.3 1.3 0 0 1-1.3 1.3h-3.6v-5.4h-5.2V20H5.8a1.3 1.3 0 0 1-1.3-1.3Z" />
    </>
  ),
  places: (
    <>
      <path d="M12 20.5s6.6-5.3 6.6-10.3a6.6 6.6 0 1 0-13.2 0c0 5 6.6 10.3 6.6 10.3Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  qr: (
    <>
      <path d="M4.5 8.5v-3a1 1 0 0 1 1-1h3M19.5 8.5v-3a1 1 0 0 0-1-1h-3M4.5 15.5v3a1 1 0 0 0 1 1h3M19.5 15.5v3a1 1 0 0 1-1 1h-3" />
      <rect x="8.4" y="8.4" width="3.1" height="3.1" rx=".7" />
      <rect x="12.5" y="8.4" width="3.1" height="3.1" rx=".7" />
      <rect x="8.4" y="12.5" width="3.1" height="3.1" rx=".7" />
      <rect x="12.5" y="12.5" width="3.1" height="3.1" rx=".7" />
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

export function BottomNav({ unread = 0 }: { unread?: number }) {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const tabs = [
    { to: '/', key: 'home' as const, label: t('home') },
    { to: '/places', key: 'places' as const, label: t('places') },
    { to: '/checkin', key: 'qr' as const, label: '' },
    { to: '/activity', key: 'bell' as const, label: t('alerts') },
    { to: '/me', key: 'me' as const, label: t('me') },
  ]

  return (
    <nav className="glass sticky bottom-0 z-50 border-t border-hair">
      <div className="mx-auto flex max-w-[520px] items-end justify-around px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        {tabs.map((tab) => {
          const active = tab.to === '/' ? pathname === '/' : pathname.startsWith(tab.to)

          if (tab.key === 'qr')
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                aria-label="Check in"
                className="flex w-14 justify-center pb-0.5"
              >
                <span
                  className="grid h-[56px] w-[56px] place-items-center rounded-full transition-transform active:scale-95"
                  style={{
                    background: 'var(--btn)',
                    boxShadow: '0 8px 28px -6px var(--gold-glow), 0 2px 8px -2px rgba(0,0,0,.6)',
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[26px] w-[26px] fill-none stroke-[1.5]"
                    stroke="var(--btn-fg)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {Icon.qr}
                  </svg>
                </span>
              </NavLink>
            )

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="relative flex w-14 flex-col items-center gap-1.5 pb-1"
            >
              <span className="relative">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[22px] w-[22px] fill-none stroke-[1.4] transition-colors"
                  stroke={active ? 'var(--gold)' : 'var(--muted)'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {Icon[tab.key]}
                </svg>
                {tab.key === 'bell' && unread > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-gold px-1 text-[9.5px] font-medium text-[#14110a]">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </span>
              <em
                className="text-[9.5px] not-italic tracking-[0.06em] transition-colors"
                style={{ color: active ? 'var(--gold-text)' : 'var(--muted)' }}
              >
                {tab.label}
              </em>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
