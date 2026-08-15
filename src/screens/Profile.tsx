import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { fetchPriorityStatus, fetchProfile, saveProfile } from '../data/queries'
import { deleteMyAccount } from '../lib/deletion'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../lib/i18n'

const THEMES = [
  { v: 'nocturne', l: 'Dark' },
  { v: 'nocturne-light', l: 'Light' },
]

export function Profile() {
  const { session, user, signOut } = useAuth()
  const { t, lang, setLang } = useI18n()
  const profile = useAsync(
    () => (user ? fetchProfile(user.id) : Promise.resolve(null)),
    [user?.id],
  )
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saved, setSaved] = useState(false)
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

  async function save() {
    if (!user) return
    await saveProfile(user.id, { full_name: name.trim() || null, phone: phone.trim() || null })
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
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
          <div className="grid h-14 w-14 place-items-center rounded-full border border-hair font-display text-xl text-goldt">
            {(name || session.user.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-2xl text-fg">{name || 'Guest'}</p>
            <p className="t-meta truncate text-[9px] text-muted">{session.user.email}</p>
            {priority.data && (
              <p className="t-meta mt-1 text-[8.5px] text-goldt">Priority access</p>
            )}
          </div>
        </div>

        <p className="t-eyebrow pb-3 pt-9">Your details</p>
        <div className="space-y-3">
          <input
            className="field"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="field"
            placeholder="Mobile (+974)"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <button className="btn mt-4 w-full" onClick={save}>
          {saved ? 'Saved' : 'Save'}
        </button>
        {profile.data === null && !profile.loading && (
          <p className="pt-3 text-[11px] leading-relaxed text-muted">
            Stored on your account until profiles ship; then it moves to your QSeat profile.
          </p>
        )}

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

        <p className="t-eyebrow pb-3 pt-9">{t('language')}</p>
        <div className="flex border border-hair">
          {(['en', 'ar'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`t-meta flex-1 py-2.5 text-[10px] ${
                lang === l ? 'bg-gold text-black' : 'text-muted'
              }`}
            >
              {l === 'en' ? 'English' : 'العربية'}
            </button>
          ))}
        </div>

        <p className="t-eyebrow pb-3 pt-9">{t('appearance')}</p>
        <div className="flex border border-hair">
          {THEMES.map((t) => (
            <button
              key={t.v}
              onClick={() => applyTheme(t.v)}
              className={`t-meta flex-1 py-2.5 text-[10px] ${
                theme === t.v ? 'bg-gold text-black' : 'text-muted'
              }`}
            >
              {t.l}
            </button>
          ))}
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
