import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../lib/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<UserRole>('brand')
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', name: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
  }, [onClose])

  useEffect(() => {
    prevFocusRef.current = document.activeElement as HTMLElement
    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => {
      modalRef.current?.querySelector<HTMLElement>('input, button')?.focus()
    })
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      prevFocusRef.current?.focus()
    }
  }, [handleKeyDown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!EMAIL_RE.test(form.email)) {
      setError('Please enter a valid email address')
      return
    }
    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await Promise.resolve(login(form.email, form.password))
      } else {
        await Promise.resolve(register({ ...form, role }))
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={mode === 'login' ? 'Sign In' : 'Create Account'}>
      <div ref={modalRef} className="bg-nexus-800 border border-nexus-600/30 rounded-2xl p-6 w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
          <button onClick={onClose} className="text-nexus-400 hover:text-white text-lg leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-400 rounded" aria-label="Close">&times;</button>
        </div>

        {mode === 'register' && (
          <div className="flex gap-2 mb-4">
            {(['brand', 'creator', 'admin'] as UserRole[]).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-all capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-400 cursor-pointer ${role === r ? 'bg-nexus-500 text-white border border-nexus-400/30' : 'bg-nexus-900 text-nexus-400 border border-transparent'}`}>
                {r}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder={role === 'brand' ? 'Brand Name' : role === 'creator' ? 'Full Name' : 'Admin Name'}
              className="w-full bg-nexus-900 border border-nexus-600/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-nexus-400 focus:outline-none focus:border-nexus-400" required />
          )}
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="w-full bg-nexus-900 border border-nexus-600/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-nexus-400 focus:outline-none focus:border-nexus-400" required />
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="Password"
            className="w-full bg-nexus-900 border border-nexus-600/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-nexus-400 focus:outline-none focus:border-nexus-400" required />
          {mode === 'register' && (
            <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Confirm Password"
              className="w-full bg-nexus-900 border border-nexus-600/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-nexus-400 focus:outline-none focus:border-nexus-400" required />
          )}
          {error && <p className="text-red-400 text-xs font-mono" role="alert">{error}</p>}
          <button type="submit" disabled={submitting}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer">
            {submitting ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-3 text-center">
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            className="text-xs text-nexus-300 hover:text-white font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-400 rounded cursor-pointer">
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}