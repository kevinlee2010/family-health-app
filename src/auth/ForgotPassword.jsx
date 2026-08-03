import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function ForgotPassword({ onSignIn }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: window.location.origin,
      },
    )

    if (resetError) {
      setError(resetError.message)
    } else {
      setMessage('Check your email for a password reset link.')
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
          <h1>Reset password</h1>
          <p>We will send a secure password reset link to your email.</p>
        </div>
      </div>

      <label className="field-group" htmlFor="forgot-email">
        Email
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
        {isSubmitting ? 'Sending...' : 'Send reset link'}
      </button>

      <button className="text-action" type="button" onClick={onSignIn}>
        Back to sign in
      </button>
    </form>
  )
}
