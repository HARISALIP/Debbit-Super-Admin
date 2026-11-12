import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase, isMissingConfig, openedFromResetLink, resetLinkError } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null | undefined
  isSuperAdmin: boolean
  checking: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** True after a "set a new password" email link was opened: the app shows the new-password form instead of the pages. */
  recovering: boolean
  sendReset: (email: string) => Promise<void>
  setNewPassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]           = useState<Session | null | undefined>(undefined)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [checking, setChecking]         = useState(true)
  const [recovering, setRecovering]     = useState(() => openedFromResetLink || !!resetLinkError)

  useEffect(() => {
    if (isMissingConfig) {
      setSession(null)
      setIsSuperAdmin(false)
      setChecking(false)
      return
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        if (session?.user?.email) {
          void checkSuperAdmin(session.user.email)
        } else {
          setChecking(false)
        }
      })
      .catch(() => {
        setSession(null)
        setIsSuperAdmin(false)
        setChecking(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      setSession(session)
      if (session?.user?.email) {
        void checkSuperAdmin(session.user.email)
      } else {
        setIsSuperAdmin(false)
        setChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkSuperAdmin(email: string): Promise<void> {
    setChecking(true)
    try {
      const { data, error } = await supabase
        .from('super_admins')
        .select('id, is_active')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.error('super_admins check notice:', error.message)
        // Fallback: If super_admins table does not exist or has error, require valid auth user
        setIsSuperAdmin(false)
      } else if (data && data.is_active) {
        setIsSuperAdmin(true)
      } else {
        setIsSuperAdmin(false)
      }
    } catch {
      setIsSuperAdmin(false)
    } finally {
      setChecking(false)
    }
  }

  async function signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    setSession(null)
    setIsSuperAdmin(false)
  }

  // The email link comes back to the site's front page with ?reset (any deep link may not be served), signed in for this one purpose.
  async function sendReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/?reset=1` })
    if (error) throw error
  }

  async function setNewPassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    setRecovering(false)
    window.history.replaceState(null, '', '/')
  }

  return (
    <AuthContext.Provider value={{ session, isSuperAdmin, checking, signIn, signOut, recovering, sendReset, setNewPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
