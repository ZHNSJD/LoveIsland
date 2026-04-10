import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase/config'
import App from './App'
import './index.css'

// ─── Auth Gate ───────────────────────────────────────────
function AuthGate() {
  const [user, setUser]       = useState(undefined) // undefined = loading
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null))
    return unsub
  }, [])

  if (user === undefined) {
    // Loading state — show nothing or a spinner
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)'
      }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--border2)', borderTopColor: 'var(--rose)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (user) return <App user={user} />

  // ── Login form ───────────────────────────────────────
  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError('Wrong email or password. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '0 24px',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(160,50,90,0.12) 0%, transparent 65%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 360, position: 'relative' }}>
        {/* App icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #c44060, #7a1a40)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, boxShadow: '0 8px 32px rgba(196,64,96,0.3)'
          }}>
            <svg width="28" height="26" viewBox="0 0 52 48" fill="none">
              <path d="M26 44 C26 44 4 30 4 16 C4 9 9.5 4 16 4 C20 4 24 6 26 10 C28 6 32 4 36 4 C42.5 4 48 9 48 16 C48 30 26 44 26 44Z" fill="white" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 28, color: 'var(--text)', marginBottom: 6 }}>
            Just for You
          </h1>
          <p style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 300 }}>
            sign in to continue
          </p>
        </div>

        <form onSubmit={handleSignIn}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                background: 'var(--surface)', border: '1px solid var(--border2)',
                borderRadius: 14, padding: '14px 18px', fontSize: 14,
                color: 'var(--text)', fontFamily: "'Outfit', sans-serif",
                fontWeight: 300, outline: 'none', width: '100%'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                background: 'var(--surface)', border: '1px solid var(--border2)',
                borderRadius: 14, padding: '14px 18px', fontSize: 14,
                color: 'var(--text)', fontFamily: "'Outfit', sans-serif",
                fontWeight: 300, outline: 'none', width: '100%'
              }}
            />
            {error && (
              <p style={{ fontSize: 12, color: 'var(--rose-lt)', textAlign: 'center', letterSpacing: '0.04em' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--rose)', border: 'none', borderRadius: 14,
                padding: '14px', fontSize: 13, letterSpacing: '0.12em',
                textTransform: 'uppercase', fontWeight: 300, color: 'white',
                fontFamily: "'Outfit', sans-serif", cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
                marginTop: 4
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>
)
