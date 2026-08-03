import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function UpdatePassword({ onComplete }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage('Your password has been updated.')
      setPassword('')
      onComplete()
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
          <h1>Update password</h1>
          <p>Choose a new password for your account.</p>
        </div>
      </div>

      <label className="field-group" htmlFor="update-password">
        New password
        <input
          id="update-password"
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
        {isSubmitting ? 'Updating...' : 'Update password'}
      </button>
    </form>
  )
}
