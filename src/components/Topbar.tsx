import { useEffect, useState } from 'react'
import { Bell, ChevronDown, Moon, ShieldCheck, Sun } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const titles: Record<string, string> = {
  '/': 'Security overview',
  '/email': 'Email analysis',
  '/sms': 'SMS & message analysis',
  '/url': 'URL scanner',
  '/voice': 'Voice analysis',
  '/calls': 'Live call protection',
  '/history': 'Analysis history',
}

export default function Topbar({ theme, onToggleTheme }: { theme: 'dark' | 'light'; onToggleTheme: () => void }) {
  const { pathname } = useLocation()
  const [user, setUser] = useState<User | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [signUp, setSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getUser().then(({ data, error }) => {
      if (active && !error) setUser(data.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => { active = false; subscription.unsubscribe() }
  }, [])
  async function submitAuth(event: React.FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setAuthError(''); setAuthMessage(''); setAuthLoading(true)
    try {
      if (signUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.session) setAuthOpen(false)
        else setAuthMessage('Account created. Check your email to confirm your address, then sign in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setAuthOpen(false)
      }
      setPassword('')
    } catch (reason) {
      setAuthError(reason instanceof Error ? reason.message : 'Authentication could not be completed.')
    } finally { setAuthLoading(false) }
  }
  async function signOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) setAuthError(error.message)
    else { setPassword(''); setAuthMessage('You are signed out.'); setAuthError('') }
  }
  return (
    <>
    <header className="topbar">
      <div className="breadcrumb"><span>THREATNEX</span><span className="crumb-slash">/</span><strong>{titles[pathname] ?? 'Security overview'}</strong></div>
      <div className="topbar-actions">
        <div className="environment-pill"><span /> LOCAL ENVIRONMENT</div>
        <button className="icon-button theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'light'} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
        <button className="profile-chip auth-trigger" onClick={() => { setAuthOpen(true); setAuthError(''); setAuthMessage('') }} aria-label={user ? `Signed in as ${user.email}` : 'Account and cloud history'}>
          <div className="profile-avatar"><ShieldCheck size={17} /></div>
          <div className="profile-text"><strong>{user?.email ?? (supabase ? 'Sign in' : 'Local mode')}</strong><small>{user ? 'Cloud history enabled' : supabase ? 'Cloud history available' : 'Browser-local history'}</small></div>
          <ChevronDown size={14} className="profile-chevron" />
        </button>
      </div>
    </header>
    {authOpen && <div className="modal-backdrop" onClick={() => setAuthOpen(false)}><section className="auth-modal panel" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Close">×</button>
      <div className="auth-brand"><ShieldCheck size={20} /></div>
      <div className="eyebrow">{supabase ? 'OPTIONAL CLOUD HISTORY' : 'LOCAL PRIVACY MODE'}</div>
      <h2 id="auth-title">{user ? 'Account settings' : supabase ? 'Secure your scan history' : 'History stays in this browser'}</h2>
      {user ? <><p className="auth-copy">Signed in as <strong>{user.email}</strong>. Your saved scans are protected by Supabase row-level security.</p><button className="button button-quiet auth-submit" onClick={() => void signOut()}>Sign out</button></>
        : supabase ? <><p className="auth-copy">Sign in to sync scan history to your Supabase account. Your password is handled by Supabase Auth and is never stored by THREATNEX.</p>
          <form onSubmit={submitAuth} className="auth-form">
            <label htmlFor="auth-email">EMAIL ADDRESS</label><input id="auth-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
            <label htmlFor="auth-password">PASSWORD</label><input id="auth-password" type="password" autoComplete={signUp ? 'new-password' : 'current-password'} required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
            {authError && <div className="form-error" role="alert">{authError}</div>}
            {authMessage && <div className="auth-message" role="status">{authMessage}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={authLoading}>{authLoading ? 'Please wait…' : signUp ? 'Create account' : 'Sign in'}</button>
          </form>
          <button className="auth-mode-toggle" onClick={() => { setSignUp(!signUp); setAuthError(''); setAuthMessage('') }}>{signUp ? 'Already have an account? Sign in' : 'New here? Create an account'}</button>
        </> : <p className="auth-copy">Cloud history is not configured. Analyses are saved only in this browser. Add your Supabase URL and public anon key to the environment to enable account sign-in and cloud sync.</p>}
      {authError && user && <div className="form-error" role="alert">{authError}</div>}
      {authMessage && user && <div className="auth-message" role="status">{authMessage}</div>}
      <div className="auth-footnote">Never place a Supabase service-role key in the browser.</div>
    </section></div>}
    </>
  )
}
