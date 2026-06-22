import { useState, useEffect } from 'react'
import { getSubmissions, verifySubmission, getCampaigns, subscribe } from '../lib/data'
import type { Submission, Campaign } from '../lib/types'
import { useToast } from './Toast'

function CircularMeter({ value, target, label, suffix }: { value: number; target: number; label: string; suffix: string }) {
  const r = 34
  const circ = 2 * Math.PI * r
  const pct = Math.min((value / target) * 100, 100)
  const offset = circ - (pct / 100) * circ
  const passed = value >= target
  const color = passed ? '#10b981' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={target} aria-label={`${label}: ${value}${suffix} of ${target}${suffix}`}>
        <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="5" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-700 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col" aria-hidden="true">
          <span className={`text-base font-bold font-mono ${passed ? 'text-emerald-400' : 'text-red-400'}`}>{value}{suffix}</span>
          <span className="text-[8px] text-nexus-500 font-mono">/ {target}{suffix}</span>
        </div>
      </div>
      <span className={`text-[10px] font-mono text-center leading-tight ${passed ? 'text-emerald-400' : 'text-red-400'}`}>{label}</span>
    </div>
  )
}

function GeoBar({ label, pct }: { label: string; pct: number }) {
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-nexus-300">{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function BotHealthMeter({ spikeScore, botRatio, flags }: { spikeScore: number; botRatio: number; flags: string[] }) {
  const health = Math.max(0, 100 - (spikeScore * 0.8 + botRatio * 1.5))
  const color = health >= 70 ? '#10b981' : health >= 40 ? '#f59e0b' : '#ef4444'
  const statusLabel = health >= 70 ? 'Clean Account' : health >= 40 ? 'Suspicious' : 'High Risk'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-nexus-300">Bot Probability Index</span>
        <span className="text-[11px] font-mono font-bold" style={{ color }}>{statusLabel}</span>
      </div>
      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${health}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-[9px] font-mono text-nexus-500">
        <span>Spike: {spikeScore}/100</span>
        <span>Bot comments: {botRatio}%</span>
        <span>Flags: {flags.length}</span>
      </div>
    </div>
  )
}

function ExpandableSub({ sub, onTrigger }: { sub: Submission; onTrigger: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const allPassed = sub.erResult.passed && sub.geoResult.passed && sub.botResult.passed

  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${
      sub.status === 'flagged' ? 'border-red-500/20 bg-red-500/[0.02]' :
      sub.status === 'paid' ? 'border-emerald-500/20 bg-emerald-500/[0.02]' :
      'border-nexus-600/30 bg-nexus-800/50 hover:border-nexus-500'
    }`}>
      <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-center justify-between text-left gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-semibold ${sub.status === 'flagged' ? 'text-red-400' : 'text-white'}`}>{sub.brandName}</span>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
              sub.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              sub.status === 'flagged' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              sub.status === 'paid' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
              sub.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}>
              {sub.status === 'paid' ? 'Approved & Disbursed' : sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-nexus-400 font-mono flex-wrap">
            <span>{sub.creatorName}</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">₹{sub.payout.toLocaleString('en-IN')}</span>
            <span>·</span>
            <span className="truncate max-w-[140px] text-nexus-500">{sub.url}</span>
            <span>·</span>
            <span className={`${allPassed ? 'text-emerald-400' : 'text-red-400'}`}>{allPassed ? '✓ All checks passing' : '⚠ Checks failing'}</span>
          </div>
        </div>
        <svg className={`w-4 h-4 text-nexus-400 transition-transform duration-300 flex-shrink-0 ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 6 8 10 12 6" /></svg>
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-5 animate-fade-in border-t border-nexus-600/20 pt-4">
          <p className="text-[10px] text-nexus-500 font-mono tracking-wider uppercase">3-Layer Automated Verification</p>

          {/* Layer A: ER Calculator */}
          <div className="glass-card p-4 bg-slate-900/50">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs text-nexus-200 font-semibold">A. Engagement Rate Calculator</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-mono ${sub.erResult.passed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                ER = ({sub.erResult.engagement.toLocaleString()} / {(sub.erResult.followers / 1000).toFixed(0)}K) × 100
              </span>
            </div>
            <div className="flex justify-center mt-2">
              <CircularMeter value={sub.erResult.er} target={5.5} label="Engagement Rate" suffix="%" />
            </div>
          </div>

          {/* Layer B: Geo-Audience Density */}
          <div className="glass-card p-4 bg-slate-900/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-nexus-200 font-semibold">B. Geo-Audience Density Map</span>
              <span className={`text-[9px] font-mono ${sub.geoResult.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                Target: {sub.geoResult.targetState} — {sub.geoResult.matchPercent}% match
              </span>
            </div>
            <div className="space-y-2">
              {sub.geoResult.topCities.map((city, i) => {
                const pct = i === 0 ? sub.geoResult.matchPercent : Math.max(15, sub.geoResult.matchPercent - i * 18)
                return <GeoBar key={city} label={city} pct={pct} />
              })}
            </div>
          </div>

          {/* Layer C: Multi-Lingual AI Audio & Fraud Matrix */}
          <div className="glass-card p-4 bg-slate-900/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-nexus-200 font-semibold">C. Multi-Lingual AI Audio & Fraud Matrix</span>
            </div>

            {/* Dual Health Indicator */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <p className="text-[9px] text-nexus-400 font-mono tracking-wider mb-1.5">Regional Speech Key-Phrase Match</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-500/60 to-purple-400 transition-all duration-500" style={{ width: '98%' }} />
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-400">98%</span>
                </div>
                <p className="text-[8px] text-nexus-500 font-mono mt-1">Local language match confidence</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <p className="text-[9px] text-nexus-400 font-mono tracking-wider mb-1.5">Bot Probability Index</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${sub.botResult.passed ? 'bg-emerald-400 shadow-lg shadow-emerald-400/30' : 'bg-red-400 shadow-lg shadow-red-400/30'} animate-pulse`} />
                  <span className="text-xs font-mono font-bold" style={{ color: sub.botResult.passed ? '#10b981' : '#ef4444' }}>
                    {sub.botResult.passed ? 'Natural Traction' : 'Synthetic Spike'}
                  </span>
                </div>
              </div>
            </div>

            <BotHealthMeter spikeScore={sub.botResult.spikeScore} botRatio={sub.botResult.botCommentRatio} flags={sub.botResult.flags} />

            {sub.botResult.flags.length > 0 && (
              <div className="mt-3 space-y-1 pl-2 border-l-2 border-red-500/30">
                {sub.botResult.flags.map((f, i) => (
                  <p key={i} className="text-[10px] text-red-400/80 font-mono">⚠ {f}</p>
                ))}
              </div>
            )}

            {sub.botResult.passed && sub.botResult.flags.length === 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-400/80 font-mono">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 1L6 14 2 9" /></svg>
                No anomalies detected — account is clean
              </div>
            )}
          </div>

          {(sub.status === 'pending' || sub.status === 'verified') && (
            <button onClick={() => onTrigger(sub.id)} disabled={!allPassed}
              className={`w-full py-3 rounded-xl text-xs font-mono font-bold transition-all duration-300 ${
                allPassed
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40'
                  : 'bg-nexus-700 text-nexus-400 cursor-not-allowed'
              }`}>
              {allPassed
                ? 'Approve Verification & Release Payout'
                : 'Checks failing — cannot approve'}
            </button>
          )}

          {sub.status === 'paid' && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 1L6 14 2 9" /></svg>
              Payout approved & disbursed — funds transferred to creator wallet
            </div>
          )}

          {sub.verifiedAt && (
            <p className="text-[9px] text-nexus-500 font-mono">
              Processed: {new Date(sub.verifiedAt).toLocaleString('en-IN')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function VerificationEngine() {
  const { toast } = useToast()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filter, setFilter] = useState('all')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    setSubmissions(getSubmissions())
    setCampaigns(getCampaigns())
    const unsub = subscribe(() => { setSubmissions(getSubmissions()); setCampaigns(getCampaigns()) })
    return unsub
  }, [])

  const handleTrigger = (subId: string) => {
    if (processing) return
    setProcessing(subId)
    setTimeout(() => {
      try {
        verifySubmission(subId)
        setSubmissions(getSubmissions())
        setCampaigns(getCampaigns())
        toast('Submission verified — payout released to creator wallet', 'success')
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Verification failed', 'error')
      }
      setProcessing(null)
    }, 1500)
  }

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter)
  const pendingCount = submissions.filter(s => s.status === 'pending').length
  const totalPayouts = submissions.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.payout, 0)
  const escrowTotal = campaigns.reduce((sum, c) => sum + c.escrowBalance, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Verification Engine</h2>
          <p className="text-sm text-nexus-300 mt-0.5">Central Technical Verification — Platform Master Admin</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right"><p className="text-nexus-400 text-[9px] tracking-wider uppercase">Awaiting Review</p><p className="text-amber-400 font-bold text-lg">{pendingCount}</p></div>
          <div className="w-px h-10 bg-nexus-600/50" />
          <div className="text-right"><p className="text-nexus-400 text-[9px] tracking-wider uppercase">Total Disbursed</p><p className="text-emerald-400 font-bold text-lg">₹{(totalPayouts / 1000).toFixed(0)}K</p></div>
          <div className="w-px h-10 bg-nexus-600/50" />
          <div className="text-right"><p className="text-nexus-400 text-[9px] tracking-wider uppercase">Escrow Pool</p><p className="text-blue-400 font-bold text-lg">₹{(escrowTotal / 100000).toFixed(1)}L</p></div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'pending', 'verified', 'flagged', 'paid'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all capitalize min-h-[44px] ${filter === s ? 'bg-nexus-500 text-white' : 'bg-nexus-800 text-nexus-400 hover:text-nexus-200 hover:bg-nexus-700/50'}`}>
            {s === 'paid' ? 'Approved & Disbursed' : s === 'pending' ? 'Awaiting Review' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <p className="text-nexus-400 text-sm font-mono">No submissions match this filter</p>
          </div>
        ) : filtered.map(sub => (
          <ExpandableSub key={sub.id} sub={sub} onTrigger={handleTrigger} />
        ))}
      </div>

      <div className="glass-card p-4 bg-nexus-800/30">
        <div className="flex items-center gap-4 text-xs text-nexus-300 font-mono flex-wrap">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span>Awaiting Review</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span>All Checks Passed</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" /><span>Flagged</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span>Approved & Disbursed</span></div>
          <div className="ml-auto text-nexus-500">{submissions.length} total submissions</div>
        </div>
      </div>
    </div>
  )
}
