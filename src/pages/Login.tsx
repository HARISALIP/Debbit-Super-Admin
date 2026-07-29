import { FormEvent, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import DebbitLogo from '../components/DebbitLogo'

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
    <div style={styles.page}>
      {/* Ambient background glows */}
      <div style={styles.blobViolet} />
      <div style={styles.blobPlum} />

      <div style={styles.card} className="fade-in">
        {/* Brand Header */}
        <div style={{ marginBottom: '28px' }}>
          <DebbitLogo size="lg" badgeText="SUPER ADMIN PORTAL" showBadge={true} />
        </div>

        <h1 style={styles.heading}>Welcome Back</h1>
        <p style={styles.subheading}>Sign in with your platform super-admin credentials.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={(e) => { void handleSubmit(e) }} style={{ width: '100%' }}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              style={styles.input}
              placeholder="admin@debbit.io"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              style={styles.input}
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
            style={{ width: '100%', justifyContent: 'center', marginTop: '16px', height: '46px', fontSize: '14px', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> : 'Sign In →'}
          </button>
        </form>

        <p style={styles.footnote}>
          Restricted to authorized debbit OS platform administrators.
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-base)',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  blobViolet: {
    position: 'absolute',
    top: '-150px', left: '-150px',
    width: '600px', height: '600px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(159,103,255,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blobPlum: {
    position: 'absolute',
    bottom: '-150px', right: '-150px',
    width: '500px', height: '500px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl)',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: 'var(--shadow-card)',
    position: 'relative',
    zIndex: 1,
  },
  heading: {
    fontSize: '22px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
    marginBottom: '6px',
  },
  subheading: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '28px',
  },
  formGroup: {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
  },
  label: {
    display: 'block',
    width: '100%',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    textAlign: 'left',
  },
  input: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font)',
    fontSize: '14px',
    outline: 'none',
  },
  footnote: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    marginTop: '24px',
  },
}
