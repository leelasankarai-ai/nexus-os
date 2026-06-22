import { useState, useEffect } from 'react'
import { computeReputation, getBadges, getBadgeDefs, subscribe } from '../lib/data'
import type { Badge } from '../lib/types'

function ReputationRing({ score }: { score: number }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#3b82f6'

  return (
    <div className="relative w-20 h-20 flex-shrink-0" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Reputation score: ${score}/100`}>
      <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="5" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <span className="text-lg font-bold font-mono tracking-tight" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

const BADGE_SVG: Record<string, string> = {
  '🎯': 'M10 2L6 10l-8 2 6 6-1 8 7-4 7 4-1-8 6-6-8-2z',
  '⭐': 'M10 1l2.5 6.5L20 8l-5 4.5 1.5 7L10 16l-6.5 4.5L5 12.5 0 8l7.5-.5z',
  '🏆': 'M6 2h8v2c0 3-2 6-4 7-2-1-4-4-4-7V2zm-4 1v1c0 4 2.5 7 5 8 0 2 1 4 3 5v2H7v2h6v-2h-3v-2c2-1 3-3 3-5 2.5-1 5-4 5-8V3H2z',
  '👑': 'M10 1L7 7l-6 1 4.5 4.5L4 18l6-3 6 3-1.5-5.5L19 8l-6-1z',
  '💰': 'M10 2C5.5 2 2 5.5 2 10s3.5 8 8 8 8-3.5 8-8-3.5-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm-1-9h2v1h1v2h-1v3h-2v-3H8v-2h1V7z',
  '💎': 'M10 1L2 8l3 8h10l3-8-8-7zm0 2.5L16 8l-2.5 5.5h-7L4 8l6-4.5z',
  '📈': 'M2 14l4-6 4 3 6-7',
}

function BadgeIcon({ icon }: { icon: string }) {
  const path = BADGE_SVG[icon]
  if (path) {
    return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-nexus-300" aria-hidden="true">
        <path d={path} />
      </svg>
    )
  }
  return <span className="text-sm" aria-hidden="true">{icon}</span>
}

function BadgeCell({ badge, locked }: { badge: { id: string; name: string; description: string; icon: string }; locked: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${locked ? 'opacity-30 grayscale' : 'bg-nexus-800/50 border border-nexus-600/20'}`}
      title={locked ? 'Locked' : badge.description}>
      <BadgeIcon icon={badge.icon} />
      <span className="text-[9px] font-mono text-center leading-tight text-nexus-300">{badge.name}</span>
    </div>
  )
}

export default function CreatorReputation({ creatorId }: { creatorId: string }) {
  const [score, setScore] = useState(0)
  const [badges, setBadges] = useState<Badge[]>([])
  const [allDefs, setAllDefs] = useState<Array<{ id: string; name: string; description: string; icon: string }>>([])

  useEffect(() => {
    const update = () => {
      setScore(computeReputation(creatorId))
      setBadges(getBadges(creatorId))
    }
    setAllDefs(getBadgeDefs())
    update()
    return subscribe(update)
  }, [creatorId])

  const unlockedIds = new Set(badges.map(b => b.id))

  return (
    <div className="glass-card p-4">
      <div className="flex items-start gap-4 mb-4">
        <ReputationRing score={score} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white uppercase tracking-wider">On-Chain Reputation</p>
          <p className="text-[10px] text-nexus-400 font-mono mt-0.5">
            {score >= 80 ? 'Elite Creator' : score >= 50 ? 'Verified Creator' : 'Emerging Creator'}
          </p>
          <div className="mt-2 w-full bg-nexus-700 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 to-emerald-300 transition-all duration-700"
              style={{ width: `${score}%` }} aria-hidden="true" />
          </div>
          <p className="text-[9px] text-nexus-500 font-mono mt-1">{badges.length} / {allDefs.length} badges unlocked</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {allDefs.map(def => (
          <BadgeCell key={def.id} badge={def} locked={!unlockedIds.has(def.id)} />
        ))}
      </div>
    </div>
  )
}