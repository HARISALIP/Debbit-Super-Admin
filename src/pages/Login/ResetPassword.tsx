import { FormEvent, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import DebbitLogo from '../../components/atoms/DebbitLogo'
import { loginStyles } from './Login.styles'
import { resetLinkError } from '../../lib/supabase'

// Shown after the "set a new password" email link is opened. Supabase has signed the person in for this purpose only.
export default function ResetPassword() {
  const { session, checking, setNewPassword } = useAuth()
  const [password, setPassword] = useState('')
  const [again, setAgain]       = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (password.length < 10) { setError('Use at least 10 characters.'); return }
    if (password !== again) { setError('The two passwords are not the same.'); return }
    setLoading(true)
    try { await setNewPassword(password) } catch (err) { setError(err instanceof Error ? err.message : 'Could not save the new password.') }
    finally { setLoading(false) }
  }

  return (
    <div style={loginStyles.page}>
      <div style={loginStyles.card} className="fade-in">
        <div style={{ marginBottom: '28px' }}><DebbitLogo size="lg" badgeText="SUPER ADMIN PORTAL" showBadge={true} /></div>
        <h1 style={loginStyles.heading}>Set a new password</h1>
        {checking && session === undefined ? <div className="spinner" /> : !session ? (
          <>
            <p style={loginStyles.subheading}>This link has expired or was already used. Go back and ask for a new one.{resetLinkError ? ` (${resetLinkError})` : ''}</p>
            <a className="btn btn-primary" style={loginStyles.submitBtn} href="/">Back to sign in</a>
          </>
        ) : (
          <form onSubmit={(e) => { void submit(e) }} style={{ width: '100%' }}>
            <p style={loginStyles.subheading}>For {session.user.email}</p>
            {error && <div className="alert alert-error">{error}</div>}
            <div style={loginStyles.formGroup}>
              <label style={loginStyles.label} htmlFor="new-password">New password</label>
              <input id="new-password" type="password" style={loginStyles.input} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required />
            </div>
            <div style={loginStyles.formGroup}>
              <label style={loginStyles.label} htmlFor="new-password-again">Type it again</label>
              <input id="new-password-again" type="password" style={loginStyles.input} value={again} onChange={e => setAgain(e.target.value)} autoComplete="new-password" required />
            </div>
            <button type="submit" className="btn btn-primary" style={loginStyles.submitBtn} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> : 'Save new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
