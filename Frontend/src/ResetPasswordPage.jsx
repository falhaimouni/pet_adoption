import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => newPassword.length >= 6 && confirmPassword.length >= 6,
    [newPassword, confirmPassword],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Missing reset token.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to reset password.');
      }

      setMessage(data.message || 'Password reset successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: '4rem auto', padding: '2rem' }}>
      <h1>Reset Your Password</h1>
      <p>Enter your new password below.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        <button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      {message ? <p style={{ color: 'green' }}>{message}</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
    </main>
  );
}
