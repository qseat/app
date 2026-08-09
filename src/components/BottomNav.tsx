import { NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

const Icon = {
  home: <path d="M4 10 12 3l8 7v10a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1Z" />,
  places: (
    <>
      <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  qr: (
    <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z" />
  ),
  bell: <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7M10.3 20a2 2 0 0 0 3.4 0" />,
  me: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </>
  ),
}

export function BottomNav({ unread = 0 }: { unread?: number }) {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const tabs = [
    { to: '/', key: 'home' as const, label: t('home') },
    { to: '/places', key: 'places' as const, label: t('places') },
    { to: '/checkin', key: 'qr' as const, label: t('checkin') },
    { to: '/activity', key: 'bell' as const, label: t('alerts') },
    { to: '/me', key: 'me' as const, label: t('me') },
  ]
  return (
    <nav className="sticky bottom-0 z-50 border-t border-hair bg-bg/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[520px] items-end justify-around px-3 pb-[max(18px,env(safe-area-inset-bottom))] pt-3">
        {tabs.map((t) => {
          const active = t.to === '/' ? pathname === '/' : pathname.startsWith(t.to)
          if (t.key === 'qr')
            return (
              <NavLink key={t.to} to={t.to} className="flex w-14 flex-col items-center gap-1">
                <span className="grid h-[52px] w-[52px] -mb-1 place-items-center rounded-full bg-gold shadow-[0_10px_26px_-8px_rgba(200,169,97,.6)]">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-[1.5]" stroke="#0B0B0C">
                    {Icon.qr}
                  </svg>
                </span>
                <em className="smallcaps not-italic text-[8.5px] text-goldt">{t.label}</em>
              </NavLink>
            )
          return (
            <NavLink key={t.to} to={t.to} className="relative flex w-14 flex-col items-center gap-1.5">
              <svg
                viewBox="0 0 24 24"
                className={`h-[21px] w-[21px] fill-none stroke-[1.3] ${active ? 'stroke-gold' : 'stroke-muted'}`}
              >
                {Icon[t.key]}
              </svg>
              {t.key === 'bell' && unread > 0 && (
                <span className="absolute -top-1 right-2 min-w-[15px] rounded-full bg-burg px-1 text-center text-[8.5px] leading-[15px] text-white">
                  {unread}
                </span>
              )}
              <em
                className={`smallcaps not-italic text-[8.5px] ${active ? 'text-goldt' : 'text-muted'}`}
              >
                {t.label}
              </em>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
