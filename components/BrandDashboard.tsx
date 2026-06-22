import { useState, useEffect, useMemo } from 'react'
import { getCampaigns, createCampaign, getTierRegions, getNiches, getMetrics, subscribe, predictReach } from '../lib/data'
import type { Campaign, CampaignTier } from '../lib/types'
import { MILESTONE_PIPELINE } from '../lib/types'
import { useToast } from './Toast'

const LOCAL_BIZ_REGIONS = ['Kakinada Jilla', 'Rajamahendravaram Hubs', 'East Godavari Clusters']

const TIER_OPTIONS: { value: CampaignTier; label: string }[] = [
  { value: 'tier1', label: 'Tier-1 Metros' },
  { value: 'tier2', label: 'Tier-2 Hubs' },
  { value: 'tier3', label: 'Tier-3 Clusters' },
]

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  escrow_funded: { label: 'Escrow Locked', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  audience_matched: { label: 'Campaign Active', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  payout_locked: { label: 'Settlement Disbursed', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  campaign_completed: { label: 'Completed', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  draft: { label: 'Draft', cls: 'bg-nexus-700/50 text-nexus-300 border-nexus-600/30' },
}

function Sparkline() {
  return (
    <div className="flex items-end gap-[2px] h-6 mt-1">
      {[40, 55, 48, 62, 58, 72, 68, 82, 76, 90, 85, 95].map((h, i) => (
        <div key={i} className="w-[3px] rounded-full animate-sparkline transition-all duration-300"
          style={{ height: `${h}%`, backgroundColor: '#10b981', opacity: 0.3 + (i / 12) * 0.7 }} />
      ))}
    </div>
  )
}

function KpiCard({ label, value, color, icon, sparkline }: { label: string; value: string; color: string; icon: string; sparkline?: boolean }) {
  return (
    <div className="glass-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 glass-glow" style={sparkline ? { boxShadow: '0 0 20px rgba(16, 185, 129, 0.08), 0 0 40px rgba(16, 185, 129, 0.04)' } : {}}>
      <div className="flex items-start justify-between mb-1">
        <span className="text-[11px] text-nexus-300 font-mono uppercase tracking-widest">{label}</span>
        <span className="text-lg opacity-50" aria-hidden="true">{icon}</span>
      </div>
      <p className="text-2xl font-bold font-mono tracking-tight" style={{ color }}>{value}</p>
      {sparkline && <Sparkline />}
    </div>
  )
}

export default function BrandEnterpriseConsole() {
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [metrics, setMetrics] = useState({ totalImpressions: 0, totalCreators: 0, totalEscrow: 0, activeCampaigns: 0, totalBudget: 0, totalTransactedCapital: 0 })
  const [showForm, setShowForm] = useState(false)
  const [localBiz, setLocalBiz] = useState(false)
  const [localBizRegion, setLocalBizRegion] = useState(LOCAL_BIZ_REGIONS[0])
  const [form, setForm] = useState({
    name: '', budget: 500000, niches: [] as string[], tiers: [] as CampaignTier[],
  })

  const reach = useMemo(() => predictReach(form.budget), [form.budget])

  useEffect(() => {
    setCampaigns(getCampaigns())
    setMetrics(getMetrics())
    const unsub = subscribe(() => { setCampaigns(getCampaigns()); setMetrics(getMetrics()) })
    return unsub
  }, [])

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.niches.length) {
      toast('Fill in campaign name and select at least one niche', 'error')
      return
    }
    if (!localBiz && !form.tiers.length) {
      toast('Select at least one regional tier', 'error')
      return
    }
    const tier = localBiz ? 'local_biz' as CampaignTier : form.tiers[0]
    const region = localBiz ? localBizRegion : undefined
    try {
      createCampaign({
        brandName: localBiz ? 'Local Biz Client' : 'Smart Clothing Hub',
        name: form.name,
        budget: form.budget,
        tier,
        region,
        targetNiches: form.niches,
      })
      toast(`Campaign "${form.name}" launched`, 'success')
      setCampaigns(getCampaigns())
      setMetrics(getMetrics())
      setShowForm(false)
      setForm({ name: '', budget: localBiz ? 2000 : 500000, niches: [], tiers: [] })
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to create campaign', 'error')
    }
  }

  const niches = getNiches()
  const allRegions = getTierRegions()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Brand Enterprise Console</h2>
          <p className="text-sm text-nexus-300 mt-0.5">National campaign hub</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-xl text-sm font-medium transition-all duration-300">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" /></svg>
          {showForm ? 'Cancel' : 'New National Campaign'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Total Transacted Capital" value={'₹' + (metrics.totalTransactedCapital / 10000000).toFixed(1) + 'Cr'} color="#10b981" icon="◈" sparkline />
        <KpiCard label="Active Live Campaigns" value={metrics.activeCampaigns.toString()} color="#3b82f6" icon="⬡" />
        <KpiCard label="Onboarded Creators Countrywide" value={metrics.totalCreators.toString()} color="#8b5cf6" icon="◆" />
        <KpiCard label="Platform Escrow Balance" value={'₹' + (metrics.totalEscrow / 100000).toFixed(1) + 'L'} color="#f59e0b" icon="⊡" />
      </div>

      {showForm && (
        <form onSubmit={handleLaunch} className="glass-card p-6 animate-slide-up border-emerald-500/10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Campaign Creation Engine</h3>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className={`text-[10px] font-mono tracking-wider transition-colors ${localBiz ? 'text-amber-400' : 'text-nexus-400'}`}>Local-Biz Mode</span>
              <button type="button" onClick={() => { setLocalBiz(!localBiz); setForm(s => ({ ...s, budget: !localBiz ? 2000 : 500000, tiers: [] })) }}
                className={`relative w-10 h-5 rounded-full transition-all duration-300 ${localBiz ? 'bg-amber-500' : 'bg-nexus-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${localBiz ? 'left-5' : 'left-0.5'}`} />
              </button>
            </label>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <label className="block text-xs text-nexus-300 mb-1.5 font-mono tracking-wider">Campaign Name</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                  placeholder={localBiz ? "e.g. Kakinada Veggie Delivery" : "e.g. National Summer Collection Drop"}
                  className="w-full bg-slate-950 border border-nexus-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder-nexus-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all" required />
              </div>
              <div>
                <label className="block text-xs text-nexus-300 mb-1.5 font-mono tracking-wider">Total Budget: <span className="text-emerald-400">₹{form.budget.toLocaleString('en-IN')}</span></label>
                <input type="range" min={localBiz ? 2000 : 50000} max={localBiz ? 50000 : 5000000} step={localBiz ? 500 : 50000} value={form.budget}
                  onChange={e => setForm(s => ({ ...s, budget: Number(e.target.value) }))}
                  className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                <div className="flex justify-between text-[10px] text-nexus-500 mt-1 font-mono">
                  <span>₹{localBiz ? '2,000' : '50,000'}</span>
                  <span>₹{localBiz ? '50,000' : '50,00,000'}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-nexus-300 mb-1.5 font-mono tracking-wider">Target Niche</label>
                <div className="flex flex-wrap gap-2">
                  {niches.map(n => (
                    <button key={n} type="button" onClick={() => setForm(s => ({ ...s, niches: s.niches.includes(n) ? s.niches.filter(x => x !== n) : [...s.niches, n] }))}
                      className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all duration-200 ${form.niches.includes(n) ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'bg-slate-950 text-nexus-400 border-nexus-600/30 hover:text-nexus-200 hover:border-nexus-500'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {localBiz && (
                <div>
                  <label className="block text-xs text-nexus-300 mb-1.5 font-mono tracking-wider">Serviceable Area</label>
                  <div className="space-y-2">
                    {LOCAL_BIZ_REGIONS.map(r => (
                      <button key={r} type="button" onClick={() => setLocalBizRegion(r)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-mono transition-all duration-200 ${localBizRegion === r ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-slate-950 text-nexus-400 border-nexus-600/30 hover:text-nexus-200 hover:border-nexus-500'}`}>
                        <span className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${localBizRegion === r ? 'bg-amber-500 border-amber-400' : 'border-nexus-500'}`}>
                            {localBizRegion === r && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{r}</span>
                        </span>
                        <span className="text-[10px] text-nexus-500">Local cluster</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-5">
              {!localBiz && (
                <div>
                  <label className="block text-xs text-nexus-300 mb-1.5 font-mono tracking-wider">Target Demographics — Regional Tier</label>
                  <div className="space-y-2">
                    {TIER_OPTIONS.map(t => {
                      const selected = form.tiers.includes(t.value)
                      return (
                        <button key={t.value} type="button" onClick={() => setForm(s => ({ ...s, tiers: selected ? s.tiers.filter(x => x !== t.value) : [...s.tiers, t.value] }))}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-mono transition-all duration-200 ${selected ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-slate-950 text-nexus-400 border-nexus-600/30 hover:text-nexus-200 hover:border-nexus-500'}`}>
                          <span className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selected ? 'bg-blue-500 border-blue-400' : 'border-nexus-500'}`}>
                              {selected && <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="3"><path d="M14 1L6 14 2 9" /></svg>}
                            </div>
                            <span>{t.label}</span>
                          </span>
                          <span className="text-[10px] text-nexus-500">{allRegions[t.value].length} cities</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Predictive Reach Optimizer */}
              <div className="glass-card p-4 bg-slate-900/60 border-blue-500/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[10px] text-blue-300 font-mono uppercase tracking-widest">Predictive Reach Optimizer</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-nexus-400 font-mono mb-1">Estimated Impressions</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold font-mono text-blue-400">{(reach.estimatedImpressions.low / (localBiz ? 1 : 100000)).toFixed(localBiz ? 0 : 1)}{localBiz ? '' : 'M'}</span>
                      <span className="text-nexus-500 text-xs">—</span>
                      <span className="text-lg font-bold font-mono text-blue-400">{(reach.estimatedImpressions.high / (localBiz ? 1 : 100000)).toFixed(localBiz ? 0 : 1)}{localBiz ? '' : 'M'}</span>
                    </div>
                    <div className="mt-1.5 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500/60 to-blue-400 transition-all duration-500"
                        style={{ width: `${localBiz ? (form.budget / 50000) * 100 : 20 + (form.budget / 5000000) * 60}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-950/50 border border-slate-800">
                    <span className="text-[10px] text-nexus-400 font-mono">Projected ROI Yield</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">{reach.projectedROI}x</span>
                  </div>
                </div>
              </div>

              {/* AI Poster & Asset Kit Previewer */}
              {localBiz && (
                <div className="glass-card p-4 bg-slate-900/60 border-amber-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[10px] text-amber-300 font-mono uppercase tracking-widest">AI Poster & Asset Kit Previewer</span>
                  </div>
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-900/30 via-slate-900 to-amber-950/30 border border-amber-500/20 p-4">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xs">LB</div>
                        <div>
                          <p className="text-xs font-bold text-white">Local-Biz Promo</p>
                          <p className="text-[8px] text-amber-400/70 font-mono">{localBizRegion}</p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3 text-center">
                        <p className="text-[10px] text-amber-300 font-bold font-mono tracking-wider uppercase">Fresh From {localBizRegion === 'Kakinada Jilla' ? 'Kakinada' : localBizRegion === 'Rajamahendravaram Hubs' ? 'Rajamahendravaram' : 'East Godavari'} 🍃</p>
                        <p className="text-[9px] text-nexus-400 font-mono mt-1">AI-generated poster matching cluster parameters</p>
                        <div className="mt-2 w-full h-1 bg-gradient-to-r from-amber-500/40 via-emerald-500/40 to-blue-500/40 rounded-full" />
                        <div className="flex justify-center gap-2 mt-2">
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Telugu</span>
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">₹{form.budget.toLocaleString('en-IN')}</span>
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Hyperlocal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-6 pt-5 border-t border-nexus-600/20">
            <button type="submit"
              className={`px-8 py-3 font-bold rounded-xl text-sm transition-all duration-300 flex items-center gap-2 shadow-lg ${
                localBiz
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 hover:shadow-amber-500/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 hover:shadow-emerald-500/40'
              }`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4 8 7 11 12 4" /></svg>
              {localBiz ? 'Launch Hyperlocal — ₹' : 'Fund Escrow & Deploy Campaign — ₹'}{form.budget.toLocaleString('en-IN')}
            </button>
          </div>
        </form>
      )}

      <div className="separator" />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-nexus-600/30">
              {['Campaign Name', 'Budget', 'Regional Target', 'Milestone Pipeline', 'Status'].map(h => (
                <th key={h} scope="col" className="text-left text-[10px] text-nexus-400 font-mono uppercase tracking-wider pb-3 pr-6">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-nexus-400 text-sm font-mono">No campaigns yet — launch your first one above</td></tr>
            ) : (campaigns.map((c, i) => {
              const pipeline = MILESTONE_PIPELINE
              const ms = c.milestones || {}
              const completedPct = pipeline.reduce((sum, p) => sum + (ms[p.phase] ? p.share : 0), 0)
              return (
              <tr key={c.id} className="border-b border-nexus-600/20 hover:bg-nexus-800/40 transition-all duration-300" style={{ animationDelay: `${i * 40}ms` }}>
                <td className="py-4 pr-6">
                  <p className="text-sm text-white font-medium">{c.name}</p>
                  <p className="text-[10px] text-nexus-400 font-mono mt-0.5">{c.brandName}</p>
                </td>
                <td className="py-4 pr-6"><span className="text-sm font-mono text-emerald-400 font-bold">₹{(c.budget / 100000).toFixed(1)}L</span></td>
                <td className="py-4 pr-6">
                  <span className="text-sm font-mono text-white">{c.region}</span>
                  <p className="text-[9px] text-nexus-500 font-mono mt-0.5">{c.targetNiches.join(', ')}</p>
                </td>
                <td className="py-4 pr-6 min-w-[200px]">
                  <div className="flex items-center gap-1 mb-1.5">
                    {pipeline.map((p, pi) => {
                      const done = ms[p.phase]
                      return (
                        <div key={p.phase} className="flex items-center gap-1">
                          {pi > 0 && <div className={`w-3 h-px ${done ? 'bg-emerald-400/50' : 'bg-nexus-600'}`} />}
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border whitespace-nowrap ${done ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-nexus-800 text-nexus-500 border-nexus-600'}`}>
                            {p.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="w-full h-1 bg-nexus-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-emerald-400 transition-all duration-500" style={{ width: `${completedPct}%` }} />
                  </div>
                  <p className="text-[8px] text-nexus-500 font-mono mt-0.5">{completedPct}% complete</p>
                </td>
                <td className="py-4 pr-6">
                  {STATUS_BADGES[c.status] ? (
                    <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all duration-300 ${STATUS_BADGES[c.status].cls}`}>
                      {STATUS_BADGES[c.status].label}
                    </span>
                  ) : (
                    <span className="text-[10px] text-nexus-400 font-mono">{c.status}</span>
                  )}
                </td>
              </tr>
            )}))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
