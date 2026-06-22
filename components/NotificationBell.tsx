import { useState, useEffect, useRef, useCallback } from 'react'
import { getNotifications, subscribe } from '../lib/data'
import type { Notification } from '../lib/types'

const TYPE_ICON: Record<string, string> = { payout: '◆', milestone: '★', escrow: '⬡', dispute: '⚠' }
const TYPE_COLOR: Record<string, string> = { payout: 'text-emerald-400', milestone: 'text-blue-400', escrow: 'text-amber-400', dispute: 'text-red-400' }

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => setNotifs(getNotifications().filter(n => n.userId === userId))
    update()
    return subscribe(update)
  }, [userId])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  const markRead = (n: Notification) => {
    n.read = true
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-lg hover:bg-nexus-700/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-400 cursor-pointer"
        aria-label={`Notifications (${unread} unread)`}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#8888dd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 2a6 6 0 00-6 6v4l-2 2h16l-2-2V8a6 6 0 00-6-6z" /><path d="M10 18a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-[9px] text-black font-bold flex items-center justify-center" aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-nexus-800 border border-nexus-600/30 rounded-xl shadow-2xl shadow-black/50 z-50 animate-fade-in">
          <div className="p-3 border-b border-nexus-600/20">
            <p className="text-xs font-semibold text-white font-mono">Notifications</p>
          </div>
          <ul className="max-h-64 overflow-y-auto" role="list" aria-label="Notification list">
            {notifs.length === 0 ? (
              <li className="p-4 text-xs text-nexus-400 text-center font-mono">No notifications</li>
            ) : notifs.map(n => (
              <li key={n.id} className={`p-3 border-b border-nexus-600/10 last:border-0 ${!n.read ? 'bg-nexus-700/30' : ''}`}
                onClick={() => markRead(n)} role="listitem">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 text-[10px] ${TYPE_COLOR[n.type] || 'text-nexus-300'}`} aria-hidden="true">
                    {TYPE_ICON[n.type] || '●'}
                  </span>
                  <div>
                    <p className="text-xs text-nexus-200">{n.message}</p>
                    <p className="text-[10px] text-nexus-500 font-mono mt-0.5">
                      {new Date(n.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}