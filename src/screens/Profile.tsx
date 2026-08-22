import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { fetchPriorityStatus, fetchProfile } from '../data/queries'
import { deleteMyAccount } from '../lib/deletion'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../lib/i18n'
import { setClock, useClock } from '../lib/prefs'

export function Profile() {
  const { session, user, signOut } = useAuth()
  const { t, lang, setLang } = useI18n()
  const clock = useClock()
  const profile = useAsync(
    () => (user ? fetchProfile(user.id) : Promise.resolve(null)),
    [user?.id],
  )
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const priority = useAsync(
    () => (user ? fetchPriorityStatus() : Promise.resolve(false)),
    [user?.id],
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteNote, setDeleteNote] = useState<string | null>(null)
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme ?? 'nocturne',
  )

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.full_name ?? '')
      setPhone(profile.data.phone ?? '')
    } else if (user?.user_metadata) {
      setName((user.user_metadata.full_name as string) ?? '')
      setPhone((user.user_metadata.phone as string) ?? '')
    }
  }, [profile.data, user])

  function applyTheme(v: string) {
    setTheme(v)
    document.documentElement.dataset.theme = v
    try {
      localStorage.setItem('qseat-theme', v)
    } catch {
      /* private mode */
    }
  }



  if (!session)
    return (
      <Screen nav={<BottomNav />}>
        <Header />
        <Empty title="Not signed in" note="Sign in to keep your bookings and preferences." />
        <Link to="/signin" className="btn mx-5 mt-2 block">
          Sign in
        </Link>
      </Screen>
    )

  return (
    <Screen nav={<BottomNav />}>
      <Header />
      <div className="px-5 pt-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-hair t-display text-xl text-goldt">
            {(name || session.user.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate t-display text-2xl text-fg">{name || 'Guest'}</p>
            <p className="t-meta truncate text-[9px] text-muted">{session.user.email}</p>
            {priority.data && (
              <p className="t-meta mt-1 text-[8.5px] text-goldt">Priority access</p>
            )}
          </div>
        </div>

        <p className="t-eyebrow pb-3 pt-9">Your details</p>
        <div className="card overflow-hidden">
          <Detail label="Name" value={name || '—'} />
          <Detail label="Mobile" value={phone || '—'} />
          <Detail label="Email" value={session.user.email ?? '—'} last />
        </div>
        <p className="pt-3 text-[11.5px] leading-relaxed text-muted">
          These are the details venues see when you arrive. To change them, contact{' '}
          <a href="mailto:support@qseat.qa" className="text-goldt">
            support@qseat.qa
          </a>
          .
        </p>

        <Link
          to="/saved"
          className="mt-9 flex items-center justify-between border-t border-hair py-4 text-[13.5px] text-fg"
        >
          {t('favourites')} <span className="text-muted">›</span>
        </Link>
        <Link
          to="/waitlist"
          className="flex items-center justify-between border-b border-hair py-4 text-[13.5px] text-fg"
        >
          {t('waitlisted')} <span className="text-muted">›</span>
        </Link>
        <Link
          to="/bookings"
          className="flex items-center justify-between border-b border-hair py-4 text-[13.5px] text-fg"
        >
          {t('upcoming')} <span className="text-muted">›</span>
        </Link>

        <p className="t-eyebrow pb-3 pt-9">Preferences</p>
        <div className="card overflow-hidden">
          <Segment
            label={t('language')}
            options={[
              { v: 'en', l: 'English' },
              { v: 'ar', l: 'العربية' },
            ]}
            value={lang}
            onChange={(v) => setLang(v as 'en' | 'ar')}
          />
          <Segment
            label={t('appearance')}
            options={[
              { v: 'nocturne', l: 'Dark' },
              { v: 'nocturne-light', l: 'Light' },
            ]}
            value={theme}
            onChange={applyTheme}
          />
          <Segment
            label="Time"
            options={[
              { v: '12', l: '12-hour' },
              { v: '24', l: '24-hour' },
            ]}
            value={clock}
            onChange={(v) => setClock(v as '12' | '24')}
            last
          />
        </div>

        <p className="t-eyebrow pb-1 pt-9">{t('legal')}</p>
        <a
          href="https://web.qseat.qa/terms"
          className="flex items-center justify-between border-b border-hair py-4 text-[13.5px] text-fg"
        >
          Terms of use <span className="text-muted">›</span>
        </a>
        <a
          href="https://web.qseat.qa/privacy"
          className="flex items-center justify-between border-b border-hair py-4 text-[13.5px] text-fg"
        >
          Privacy policy <span className="text-muted">›</span>
        </a>
        <a
          href="https://web.qseat.qa/support"
          className="flex items-center justify-between border-b border-hair py-4 text-[13.5px] text-fg"
        >
          Support <span className="text-muted">›</span>
        </a>

        <button
          onClick={() => setConfirmDelete(true)}
          className="flex w-full items-center justify-between border-b border-hair py-4 text-left text-[13.5px]"
          style={{ color: 'var(--burg)' }}
        >
          Delete my account <span className="text-muted">›</span>
        </button>

        {confirmDelete && (
          <div className="mt-5 border p-5" style={{ borderColor: 'var(--burg)' }}>
            <p className="t-title text-[19px] text-fg">Delete your account?</p>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              Your name, contact details, saved places, lists and reviews are erased and cannot be
              recovered. Venues keep their own record of covers they served, without your details
              attached — that is their trading history, not your data.
            </p>
            {deleteNote && (
              <p className="mt-3 text-[12px] leading-relaxed text-goldt">{deleteNote}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                className="btn flex-1"
                style={{ background: 'var(--burg)', color: '#fff' }}
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    const r = await deleteMyAccount()
                    if (!r.credentialRemoved && r.note) setDeleteNote(r.note)
                    else window.location.href = '/'
                  } catch (e) {
                    setDeleteNote((e as Error).message)
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? 'Erasing' : 'Delete everything'}
              </button>
              <button
                className="t-meta flex-1 border border-hair py-3 text-[10px] text-muted"
                onClick={() => setConfirmDelete(false)}
              >
                Keep my account
              </button>
            </div>
          </div>
        )}

        <button className="btn btn-ghost mt-9 w-full" onClick={signOut}>
          {t('signOut')}
        </button>
        <p className="t-meta py-8 text-center text-[9px] text-muted">
          QSeat 0.1 · Developed by Odysense
        </p>
      </div>
    </Screen>
  )
}

function Header() {
  return (
    <div className="px-5 pb-2 pt-[max(52px,env(safe-area-inset-top))]">
      <p className="text-center t-title text-[15px] uppercase tracking-[0.5em] text-goldt">Me</p>
    </div>
  )
}

function Detail({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3.5"
      style={{ borderBottom: last ? 'none' : '1px solid var(--hair)' }}
    >
      <span className="t-meta text-[11.5px]">{label}</span>
      <span className="truncate pl-4 text-[13.5px] text-fg">{value}</span>
    </div>
  )
}

/**
 * A sliding segmented control rather than two bordered boxes. The indicator
 * moves, so the change reads as one state with two positions instead of two
 * buttons where one happens to be lit.
 */
function Segment({
  label,
  options,
  value,
  onChange,
  last,
}: {
  label: string
  options: { v: string; l: string }[]
  value: string
  onChange: (v: string) => void
  last?: boolean
}) {
  const i = Math.max(0, options.findIndex((o) => o.v === value))
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3"
      style={{ borderBottom: last ? 'none' : '1px solid var(--hair)' }}
    >
      <span className="t-meta text-[11.5px]">{label}</span>
      <div
        className="relative flex flex-none rounded-sm bg-surface2 p-[3px]"
        style={{ width: options.length * 92 }}
      >
        <span
          className="absolute inset-y-[3px] rounded-[4px] bg-gold transition-transform duration-200 ease-out"
          style={{
            width: 92 - 6,
            transform: `translateX(${i * 92}px)`,
          }}
        />
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className="relative z-10 h-8 flex-1 text-[11.5px] transition-colors"
            style={{ color: o.v === value ? '#14110a' : 'var(--muted)' }}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )
}
