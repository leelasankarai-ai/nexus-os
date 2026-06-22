import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../lib/types'
import BrandDashboard from '../components/BrandDashboard'
import CreatorView from '../components/CreatorView'
import AdminEscrow from '../components/AdminEscrow'
import AuthModal from '../components/AuthModal'
import NotificationBell from '../components/NotificationBell'

function LightningBolt() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg drop-shadow-emerald-500/30">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#10b981" fillOpacity="0.15" />
    </svg>
  )
}

const TABS = [
  { id: 'brand', label: 'Brand Dashboard', icon: '◈', short: 'Brand', roles: ['brand', 'admin'] as const },
  { id: 'creator', label: 'Creator Studio', icon: '◆', short: 'Studio', roles: ['creator', 'admin'] as const },
  { id: 'admin', label: 'Admin Escrow', icon: '⬡', short: 'Escrow', roles: ['admin'] as const },
]

export default function Home() {
  const { user, loading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('brand')
  const [showAuth, setShowAuth] = useState(true)

  const availableTabs = useMemo(() => {
    if (!user) return []
    return TABS.filter(t => t.roles.includes(user.role as any))
  }, [user])

  const effectiveTab = useMemo(() => {
    if (!availableTabs.length) return null
    return availableTabs.find(t => t.id === activeTab) ? activeTab : availableTabs[0].id
  }, [activeTab, availableTabs])

  if (loading) {
    return (
      <div className="min-h-screen bg-nexus-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center animate-pulse"><LightningBolt /></div>
          <p className="text-nexus-300 text-sm font-mono">Loading Spotipay...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-nexus-900 flex flex-col">
        <header className="border-b border-nexus-600/30 bg-nexus-900/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center" aria-hidden="true">
                <LightningBolt />
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg leading-none">Spotipay</h1>
                <p className="text-[10px] text-nexus-300 tracking-widest uppercase font-mono">Programmatic Escrow Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAuth(true)}
                className="px-4 py-2 bg-nexus-500 hover:bg-nexus-400 text-white rounded-lg text-sm font-medium transition-all border border-nexus-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-400">
                Sign In
              </button>
              <button onClick={() => setShowAuth(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                Register
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center py-8 px-4">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20" aria-hidden="true">
              <LightningBolt />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Spotipay</h2>
            <p className="text-sm text-nexus-300 mb-8">Sign in to access your dashboard</p>
          </div>
        </main>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nexus-900">
        <header className="sticky top-0 z-50 border-b border-slate-800/60" style={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20" aria-hidden="true">
                  <LightningBolt />
                </div>
                <div>
                  <h1 className="text-white font-semibold text-lg leading-none">Spotipay</h1>
                  <p className="text-[10px] text-nexus-300 tracking-widest uppercase font-mono">Programmatic Escrow Platform</p>
                </div>
              </div>
            <div className="flex items-center gap-2">
              <NotificationBell userId={user.id} />
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/60 rounded-xl p-1 border border-slate-700/40 shadow-inner shadow-black/10">
                {availableTabs.map(tab => {
                  const isActive = effectiveTab === tab.id
                  const tabColor = tab.id === 'brand' ? 'border-blue-400/40 bg-blue-500/10 text-blue-300' : tab.id === 'creator' ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' : 'border-purple-400/40 bg-purple-500/10 text-purple-300'
                  const dotColor = tab.id === 'brand' ? 'bg-blue-400' : tab.id === 'creator' ? 'bg-emerald-400' : 'bg-purple-400'
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-400 ${isActive ? tabColor + ' shadow-lg shadow-black/20' : 'text-nexus-400 hover:text-nexus-200 hover:bg-slate-700/30'}`}>
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive ? dotColor : 'bg-slate-600'}`} />
                      <span className={`${tab.id === 'brand' ? 'text-blue-300' : tab.id === 'creator' ? 'text-emerald-300' : 'text-purple-300'}`}>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-3 ml-2">
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-nexus-800/50">
                  <div className="w-6 h-6 rounded-full bg-nexus-500 flex items-center justify-center text-[10px] text-white font-bold">
                    {user.avatar}
                  </div>
                  <span className="text-xs text-nexus-200 hidden sm:inline">{user.name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : user.role === 'brand' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {user.role}
                  </span>
                </div>
                <button onClick={logout}
                  className="text-nexus-400 hover:text-white text-xs font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-400 rounded">
                  Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20 sm:pb-6">
        {effectiveTab === 'brand' && <BrandDashboard />}
        {effectiveTab === 'creator' && <CreatorView />}
        {effectiveTab === 'admin' && <AdminEscrow />}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-nexus-900/95 backdrop-blur-md border-t border-nexus-600/30 z-50">
        <div className="flex">
          {availableTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 text-[10px] font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-400 ${effectiveTab === tab.id ? 'text-emerald-400' : 'text-nexus-400'}`}>
              <span className="text-base mb-0.5">{tab.icon}</span>
              <span>{tab.short}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
