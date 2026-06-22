import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Session, KycTier, UserRole } from '../lib/types'

const MOCK_USERS = [
  { id: 'brand-1', email: 'brand@nexus.io', password: 'brand', name: 'Smart Clothing Hub', role: 'brand' as UserRole, avatar: 'SC', kycTier: 'verified' as KycTier },
  { id: 'brand-2', email: 'fresh@nexus.io', password: 'fresh', name: 'Fresh Mart Inc', role: 'brand' as UserRole, avatar: 'FM', kycTier: 'basic' as KycTier },
  { id: 'creator-1', email: 'creator@nexus.io', password: 'creator', name: 'Priya Sharma', role: 'creator' as UserRole, avatar: 'PS', wallet: 18400, kycTier: 'verified' as KycTier },
  { id: 'creator-2', email: 'arjun@nexus.io', password: 'arjun', name: 'Arjun Reddy', role: 'creator' as UserRole, avatar: 'AR', wallet: 9200, kycTier: 'basic' as KycTier },
  { id: 'admin-1', email: 'admin@nexus.io', password: 'admin', name: 'Nexus Admin', role: 'admin' as UserRole, avatar: 'NA', kycTier: 'business' as KycTier },
]

function generateToken() {
  return 'nexus_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

interface AuthContextType {
  user: Session | null
  loading: boolean
  login: (email: string, password: string) => Session
  register: (data: { email: string; password: string; name: string; role: UserRole }) => Session
  logout: () => void
  demoLogin: (role: UserRole) => Session
  kycTiers: { label: string; tier: KycTier; limit: number }[]
}

const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string }> = {
  brand: { email: 'brand@nexus.io', password: 'brand' },
  creator: { email: 'creator@nexus.io', password: 'creator' },
  admin: { email: 'admin@nexus.io', password: 'admin' },
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(session => setUser(session))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((email: string, password: string) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password)
    if (!found) throw new Error('Invalid credentials')
    const session: Session = {
      id: found.id, email: found.email, name: found.name,
      role: found.role, avatar: found.avatar, wallet: (found as any).wallet,
      kycTier: found.kycTier, token: generateToken(),
    }
    localStorage.setItem('nexus_user', JSON.stringify(session))
    setUser(session)
    return session
  }, [])

  const register = useCallback((data: { email: string; password: string; name: string; role: UserRole }) => {
    const exists = MOCK_USERS.find(u => u.email === data.email)
    if (exists) throw new Error('Email already registered')
    const newUser = {
      id: `${data.role}-${Date.now()}`, email: data.email, password: data.password,
      name: data.name, role: data.role,
      avatar: data.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
      wallet: data.role === 'creator' ? 0 : undefined,
      kycTier: 'basic' as KycTier,
    }
    MOCK_USERS.push(newUser)
    return login(data.email, data.password)
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem('nexus_user')
    fetch('/api/auth/logout').catch(() => {})
    setUser(null)
  }, [])

  const demoLogin = useCallback((role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role]
    if (!creds) throw new Error(`No demo account for role: ${role}`)
    return login(creds.email, creds.password)
  }, [login])

  const kycTiers = [
    { label: 'Guest', tier: 'guest' as KycTier, limit: 0 },
    { label: 'Basic', tier: 'basic' as KycTier, limit: 5000 },
    { label: 'Verified', tier: 'verified' as KycTier, limit: 100000 },
    { label: 'Business', tier: 'business' as KycTier, limit: 9999999 },
  ]

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, demoLogin, kycTiers }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
