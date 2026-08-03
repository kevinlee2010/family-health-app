import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function SignUp({ onSignIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
    } else {
      setMessage('Check your email to verify your account before signing in.')
      setPassword('')
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
          <h1>Create account</h1>
          <p>Use email and password to save your profile securely.</p>
        </div>
      </div>

      <label className="field-group" htmlFor="signup-email">
        Email
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label className="field-group" htmlFor="signup-password">
        Password
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {message ? (
        <p className="flow-message success" role="status">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="flow-message error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="primary-action" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>

      <button className="text-action" type="button" onClick={onSignIn}>
        Already have an account? Sign in
      </button>
    </form>
  )
}
