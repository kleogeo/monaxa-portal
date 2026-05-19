import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Invalid credentials. Please try again.')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-gold rounded-sm" />
            <span className="font-display text-2xl font-bold tracking-tight text-white">MONAXA</span>
          </div>
          <p className="text-brand-muted text-sm tracking-widest uppercase">Operations Portal</p>
        </div>

        {/* Card */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-brand-muted mb-1.5">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@monaxa.com"
                required
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-gold transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-brand-muted mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-gold transition-colors"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg px-4 py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-brand-muted text-xs mt-6">
          Access restricted to Monaxa team members
        </p>
      </div>
    </div>
  )
}
