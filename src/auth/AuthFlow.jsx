import { useState } from 'react'
import { ForgotPassword } from './ForgotPassword'
import { PublicHome } from './PublicHome'
import { SignIn } from './SignIn'
import { SignUp } from './SignUp'
import { UpdatePassword } from './UpdatePassword'
import { useAuth } from './useAuth'

export function AuthFlow() {
  const { clearPasswordRecovery, isPasswordRecovery } = useAuth()
  const [authView, setAuthView] = useState('home')

  if (isPasswordRecovery) {
    return (
      <main className="auth-screen">
        <UpdatePassword onComplete={clearPasswordRecovery} />
      </main>
    )
  }

  if (authView === 'home') {
    return (
      <PublicHome
        onGetStarted={() => setAuthView('sign-up')}
        onSignIn={() => setAuthView('sign-in')}
      />
    )
  }

  return (
    <main className="auth-screen">
      {authView === 'sign-up' ? (
        <SignUp
          onBackHome={() => setAuthView('home')}
          onSignIn={() => setAuthView('sign-in')}
        />
      ) : null}

      {authView === 'forgot-password' ? (
        <ForgotPassword
          onBackHome={() => setAuthView('home')}
          onSignIn={() => setAuthView('sign-in')}
        />
      ) : null}

      {authView === 'sign-in' ? (
        <SignIn
          onBackHome={() => setAuthView('home')}
          onForgotPassword={() => setAuthView('forgot-password')}
          onSignUp={() => setAuthView('sign-up')}
        />
      ) : null}
    </main>
  )
}
