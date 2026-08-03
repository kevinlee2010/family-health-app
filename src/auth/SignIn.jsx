import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function SignIn({ onForgotPassword, onSignUp }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
    }

    setIsSubmitting(false)
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <div className="auth-heading">
        <span className="brand-mark" aria-hidden="true">
          +
        </span>
        <div>
          <h1>Sign in</h1>
          <p>Access your family health profile across devices.</p>
        </div>
      </div>

      <label className="field-group" htmlFor="signin-email">
        Email
        <input
          id="signin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label className="field-group" htmlFor="signin-password">
        Password
        <input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {error ? (
        <p className="flow-message error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="primary-action" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>

      <div className="auth-link-row">
        <button className="text-action" type="button" onClick={onForgotPassword}>
          Forgot password?
        </button>
        <button className="text-action" type="button" onClick={onSignUp}>
          Create account
        </button>
      </div>
    </form>
  )
}
