import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, onAuthChange, getSession } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(undefined) // undefined = loading
  const [profile, setProfile]   = useState(null)

  useEffect(() => {
    // Load initial session
    getSession().then(({ data }) => setSession(data.session ?? null))

    // Listen for auth changes
    const { data: { subscription } } = onAuthChange((sess) => {
      setSession(sess ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load profile whenever session changes
  useEffect(() => {
    if (!session?.user) { setProfile(null); return }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data))
  }, [session])

  const loading = session === undefined

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
