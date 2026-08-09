import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'signup'

export function SignIn() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const nav = useNavigate()
  const loc = useLocation() as { state?: { from?: string } }

  async function submit() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, phone } },
        })
        if (error) throw error
        setNotice('Check your email to confirm the address, then sign in.')
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        nav(loc.state?.from ?? '/', { replace: true })
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const valid = email.includes('@') && password.length >= 6 && (mode === 'signin' || fullName.trim())

  return (
    <div className="mx-auto flex h-full max-w-[520px] flex-col justify-center bg-bg px-7 pb-10 pt-[max(40px,env(safe-area-inset-top))]">
      <p className="text-center font-display text-[15px] uppercase tracking-[0.5em] text-goldt">
        QSeat
      </p>
      <h1 className="mt-9 font-display text-[34px] leading-tight text-fg">
        {mode === 'signin' ? 'Welcome back' : 'Create an account'}
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {mode === 'signin'
          ? 'Sign in to reserve a table and keep your bookings in one place.'
          : 'Reserve in seconds, and arrive without explaining yourself.'}
      </p>

      <div className="mt-8 space-y-3">
        {mode === 'signup' && (
          <>
            <input
              className="field"
              placeholder="Full name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              className="field"
              placeholder="Mobile (+974)"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </>
        )}
        <input
          className="field"
          placeholder="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="field"
          placeholder="Password"
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p className="mt-4 text-[12.5px] leading-relaxed text-burg">{error}</p>}
      {notice && <p className="mt-4 text-[12.5px] leading-relaxed text-goldt">{notice}</p>}

      <button className="btn mt-7 w-full" disabled={busy || !valid} onClick={submit}>
        {busy ? 'One moment' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>

      <button
        className="smallcaps mt-6 text-muted"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin')
          setError(null)
        }}
      >
        {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>

      <Link to="/" className="smallcaps mt-8 text-center text-muted">
        Browse without an account
      </Link>
    </div>
  )
}
