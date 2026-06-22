import type { NextApiRequest, NextApiResponse } from 'next'
import type { Session } from '../../../lib/types'

const MOCK_USERS = [
  { id: 'brand-1', email: 'brand@nexus.io', password: 'brand', name: 'Smart Clothing Hub', role: 'brand' as const, avatar: 'SC', kycTier: 'verified' as const },
  { id: 'brand-2', email: 'fresh@nexus.io', password: 'fresh', name: 'Fresh Mart Inc', role: 'brand' as const, avatar: 'FM', kycTier: 'basic' as const },
  { id: 'creator-1', email: 'creator@nexus.io', password: 'creator', name: 'Priya Sharma', role: 'creator' as const, avatar: 'PS', wallet: 18400, kycTier: 'verified' as const },
  { id: 'creator-2', email: 'arjun@nexus.io', password: 'arjun', name: 'Arjun Reddy', role: 'creator' as const, avatar: 'AR', wallet: 9200, kycTier: 'basic' as const },
  { id: 'admin-1', email: 'admin@nexus.io', password: 'admin', name: 'Nexus Admin', role: 'admin' as const, avatar: 'NA', kycTier: 'business' as const },
]

function generateToken() {
  return 'nexus_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const found = MOCK_USERS.find(u => u.email === email && u.password === password)
  if (!found) return res.status(401).json({ error: 'Invalid credentials' })

  const session: Session = {
    id: found.id, email: found.email, name: found.name,
    role: found.role, avatar: found.avatar, wallet: (found as any).wallet,
    kycTier: found.kycTier, token: generateToken(),
  }

  res.setHeader('Set-Cookie', `nexus_session=${encodeURIComponent(JSON.stringify(session))}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`)
  return res.status(200).json(session)
}
