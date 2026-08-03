import { useState } from 'react'
import { ForgotPassword } from './ForgotPassword'
import { SignIn } from './SignIn'
import { SignUp } from './SignUp'
import { UpdatePassword } from './UpdatePassword'
import { useAuth } from './useAuth'

export function AuthFlow() {
  const { clearPasswordRecovery, isPasswordRecovery } = useAuth()
  const [authView, setAuthView] = useState('sign-in')

  if (isPasswordRecovery) {
    return (
      <main className="auth-screen">
        <UpdatePassword onComplete={clearPasswordRecovery} />
      </main>
    )
  }

  return (
    <main className="auth-screen">
      {authView === 'sign-up' ? (
        <SignUp onSignIn={() => setAuthView('sign-in')} />
      ) : null}

      {authView === 'forgot-password' ? (
        <ForgotPassword onSignIn={() => setAuthView('sign-in')} />
      ) : null}

      {authView === 'sign-in' ? (
        <SignIn
          onForgotPassword={() => setAuthView('forgot-password')}
          onSignUp={() => setAuthView('sign-up')}
        />
      ) : null}
    </main>
  )
}
