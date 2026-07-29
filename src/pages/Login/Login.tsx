import { FormEvent, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import DebbitLogo from '../../components/atoms/DebbitLogo'
import { loginStyles } from './Login.styles'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err: any) {
      let msg = 'Sign-in failed'
      if (typeof err === 'string') msg = err
      else if (err?.message) msg = err.message
      else if (err?.error_description) msg = err.error_description
      else if (err && typeof err === 'object') {
        try { msg = JSON.stringify(err) } catch { msg = String(err) }
      }
      if (msg === '{}' || !msg) msg = 'Invalid API key or Network error. Please check your Supabase anon key.'
      if (msg.includes('Invalid login')) msg = 'Invalid email or password.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={loginStyles.page}>
      <div style={loginStyles.blobViolet} />
      <div style={loginStyles.blobPlum} />

      <div style={loginStyles.card} className="fade-in">
        <div style={{ marginBottom: '28px' }}>
          <DebbitLogo size="lg" badgeText="SUPER ADMIN PORTAL" showBadge={true} />
        </div>

        <h1 style={loginStyles.heading}>Welcome Back</h1>
        <p style={loginStyles.subheading}>Sign in with your platform super-admin credentials.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={(e) => { void handleSubmit(e) }} style={{ width: '100%' }}>
          <div style={loginStyles.formGroup}>
            <label style={loginStyles.label} htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              style={loginStyles.input}
              placeholder="admin@debbit.io"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div style={loginStyles.formGroup}>
            <label style={loginStyles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              style={loginStyles.input}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={loginStyles.submitBtn}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> : 'Sign In →'}
          </button>
        </form>

        <p style={loginStyles.footnote}>
          Restricted to authorized debbit OS platform administrators.
        </p>
      </div>
    </div>
  )
}
