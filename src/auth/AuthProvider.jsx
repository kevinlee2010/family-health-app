import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (!error) {
        setSession(data.session)
      }

      setIsAuthLoading(false)
    }

    loadSession()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession)
        setIsAuthLoading(false)

        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true)
        }
      },
    )

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      clearPasswordRecovery: () => setIsPasswordRecovery(false),
      isAuthLoading,
      isPasswordRecovery,
      session,
      user: session?.user || null,
    }),
    [isAuthLoading, isPasswordRecovery, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
