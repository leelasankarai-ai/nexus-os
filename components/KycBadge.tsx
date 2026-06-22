import type { KycTier } from '../lib/types'

const TIER_CONFIG: Record<KycTier, { label: string; color: string; bg: string }> = {
  guest: { label: 'Guest', color: 'text-nexus-400', bg: 'bg-nexus-700/50' },
  basic: { label: 'Basic', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  verified: { label: 'Verified', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  business: { label: 'Business', color: 'text-purple-400', bg: 'bg-purple-500/10' },
}

export default function KycBadge({ tier }: { tier: KycTier }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.guest
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} border border-current/20`}>
      {cfg.label}
    </span>
  )
}
