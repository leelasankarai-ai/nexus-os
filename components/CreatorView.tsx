import { useState, useEffect } from 'react'
import { getDeals, acceptDeal, submitDealContent, getCreator, getNotifications, subscribe, withdrawAll, computeTDS, computeNetPayout } from '../lib/data'
import type { Deal, Creator, Notification } from '../lib/types'
import CreatorReputation from './CreatorReputation'
import { useToast } from './Toast'
import { useAuth } from '../context/AuthContext'

const DISBURSAL_PHASES = [
  { label: 'Generating Form 16-A Ledger...', duration: 2500 },
  { label: 'Scanning Regional Language Compliance...', duration: 2000 },
  { label: 'Routing Instant Bank UPI API Payout...', duration: 2500 },
  { label: 'Payout Settled Successfully!', duration: 1500 },
]

function TaxBreakdownDropdown({ grossPayout }: { grossPayout: number }) {
  const [open, setOpen] = useState(false)
  const tds = computeTDS(grossPayout)
  const net = computeNetPayout(grossPayout)
  return (
    <div className="rounded-xl border border-slate-700/40 overflow-hidden transition-all duration-300">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono bg-slate-800/30 hover:bg-slate-800/50 transition-all">
        <span className="text-nexus-300">Tax Breakdown Ledger</span>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">₹{net.toLocaleString('en-IN')} net</span>
          <svg className={`w-3.5 h-3.5 text-nexus-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 6 8 10 12 6" /></svg>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2 animate-fade-in">
          <div className="flex justify-between text-xs font-mono py-2 px-3 rounded-lg bg-slate-950/50 border border-slate-800">
            <span className="text-nexus-300">Gross Earnings</span>
            <span className="text-white font-semibold">₹{grossPayout.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-xs font-mono py-2 px-3 rounded-lg bg-slate-950/50 border border-slate-800">
            <span className="text-nexus-400">-1% Automated TDS Deduction</span>
            <span className="text-red-400">-₹{tds.toLocaleString('en-IN')}</span>
          </div>
          <div className="border-t border-slate-700/30 pt-2 flex justify-between text-xs font-mono">
            <span className="text-emerald-400 font-semibold">Net Payout Disbursal</span>
            <span className="text-emerald-400 font-bold text-sm">₹{net.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreatorLiquidityWallet() {
  const { toast } = useToast()
  const { user } = useAuth()
  const creatorId = user?.id || 'creator-1'
  const [deals, setDeals] = useState<Deal[]>([])
  const [creator, setCreator] = useState<Creator | null>(null)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [acceptedIds, setAcceptedIds] = useState(new Set<string>())
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [link, setLink] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawPhase, setWithdrawPhase] = useState(-1)
  const [withdrawDone, setWithdrawDone] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setDeals(getDeals())
    setCreator(getCreator(creatorId))
    setNotifs(getNotifications())
    const unsub = subscribe(() => { setDeals(getDeals()); setCreator(getCreator(creatorId)); setNotifs(getNotifications()) })
    return unsub
  }, [creatorId])

  const handleCashout = () => {
    if (withdrawing || !creator || creator.wallet <= 0) return
    setWithdrawing(true)
    setWithdrawPhase(0)
    setWithdrawDone(false)

    const prevBalance = creator.wallet
    const netAmount = computeNetPayout(prevBalance)
    const run = async () => {
      for (let i = 0; i < DISBURSAL_PHASES.length; i++) {
        await new Promise(r => setTimeout(r, DISBURSAL_PHASES[i].duration))
        setWithdrawPhase(i + 1)
      }
      withdrawAll()
      setWithdrawDone(true)
      setWithdrawing(false)
      toast(`Success! ₹${netAmount.toLocaleString('en-IN')} safely transferred directly to your linked UPI ID.`, 'success')
      setTimeout(() => { setWithdrawDone(false); setWithdrawPhase(-1) }, 4000)
    }
    run()
  }

  const handleAccept = async (deal: Deal) => {
    setAcceptingId(deal.id)
    try {
      await Promise.resolve(acceptDeal(deal.id, creatorId))
      setAcceptedIds(prev => new Set(prev).add(deal.id))
      setSelectedDeal(deal)
      toast(`Brief accepted: ${deal.brandName}`, 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to accept deal', 'error')
    }
    setAcceptingId(null)
  }

  const handleSubmit = async () => {
    if (!link.trim() || !selectedDeal || submitting) return
    setSubmitting(true)
    try {
      await Promise.resolve(submitDealContent(selectedDeal.id, creatorId, link.trim()))
      setLink('')
      setSubmitMsg(`Content submitted for ${selectedDeal.brandName} — ₹${selectedDeal.payout.toLocaleString('en-IN')}`)
      toast('Submission received — awaiting admin verification', 'success')
      setTimeout(() => setSubmitMsg(null), 4000)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Submission failed', 'error')
    }
    setSubmitting(false)
  }

  const walletBalance = creator?.wallet ?? 0

  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl shadow-black/40">
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Creator Wallet</h2>
              <p className="text-[11px] text-nexus-300 font-mono mt-0.5">Liquidity Portal</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 2a6 6 0 00-6 6v4l-2 2h16l-2-2V8a6 6 0 00-6-6z" /><path d="M10 18a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          {/* Liquidity Vault Banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
                <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest">Liquidity Vault — Active</span>
              </div>
              <p className="text-[11px] text-nexus-300 font-mono mb-1">Available to Withdraw</p>
              <div className="flex items-baseline gap-2 mb-5">
                <span className={`text-4xl font-bold font-mono tracking-tight transition-all duration-500 ${withdrawDone ? 'text-nexus-500' : 'text-emerald-400'}`}>
                  ₹{walletBalance.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-nexus-500 font-mono">INR</span>
              </div>
              <button onClick={handleCashout} disabled={withdrawing || walletBalance <= 0}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 13V15H3V13" /><polyline points="9 3 9 11 9 3" /><line x1="9" y1="11" x2="12" y2="8" /><line x1="9" y1="11" x2="6" y2="8" />
                </svg>
                {withdrawing ? 'Processing...' : 'Instant Cashout via UPI / IMPS'}
              </button>

              {/* Disbursal Sequence */}
              {withdrawPhase >= 0 && !withdrawDone && (
                <div className="mt-4 space-y-3 animate-fade-in">
                  {DISBURSAL_PHASES.map((phase, i) => (
                    <div key={phase.label}
                      className={`flex items-center gap-3 text-xs font-mono transition-all duration-500 ${i < withdrawPhase ? 'text-emerald-400' : i === withdrawPhase ? 'text-white' : 'text-nexus-600'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${i < withdrawPhase ? 'bg-emerald-500/20 border-emerald-400' : i === withdrawPhase ? 'bg-blue-500/20 border-blue-400 animate-pulse' : 'border-nexus-600'}`}>
                        {i < withdrawPhase
                          ? <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#34d399" strokeWidth="3"><path d="M14 1L6 14 2 9" /></svg>
                          : i === withdrawPhase
                          ? <div className="w-2 h-2 rounded-full bg-blue-400" />
                          : null}
                      </div>
                      <span className="flex-1">{phase.label}</span>
                      {i === withdrawPhase && (
                        <span className="text-[10px] text-nexus-400">{phase.duration / 1000}s</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {withdrawDone && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-slide-up">
                  <div className="flex items-center gap-2 mb-1">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"><path d="M14 1L6 14 2 9" /></svg>
                    <span className="text-sm font-bold text-emerald-400 font-mono">Settlement Successful!</span>
                  </div>
                  <p className="text-xs text-nexus-300 font-mono">Funds routed to your linked UPI ID</p>
                </div>
              )}
            </div>
          </div>

          {/* Tax Breakdown Ledger Dropdown */}
          {creator && creator.wallet > 0 && (
            <TaxBreakdownDropdown grossPayout={creator.wallet} />
          )}

          {/* Stats bar */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/30 text-[11px] font-mono">
            <div className="text-center">
              <p className="text-nexus-400 text-[9px] tracking-wider uppercase">Total Earned</p>
              <p className="text-white font-bold mt-0.5">₹{creator?.totalEarned.toLocaleString('en-IN') || '0'}</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center">
              <p className="text-nexus-400 text-[9px] tracking-wider uppercase">Deals Done</p>
              <p className="text-emerald-400 font-bold mt-0.5">{creator?.completedDeals || 0}</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center">
              <p className="text-nexus-400 text-[9px] tracking-wider uppercase">Rating</p>
              <p className="text-amber-400 font-bold mt-0.5">{creator?.rating || 0}★</p>
            </div>
          </div>

          {creator && <CreatorReputation creatorId={creator.id} />}

          {/* Deal Feed */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
              Active Brand Briefs
              <span className="text-[10px] font-mono text-nexus-400 bg-slate-800 px-1.5 py-0.5 rounded">{deals.length} live</span>
            </h3>
            <div className="space-y-3">
              {deals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-nexus-600/30 p-6 text-center">
                  <p className="text-xs text-nexus-400 font-mono">No brand briefs available right now</p>
                  <p className="text-[10px] text-nexus-500 font-mono mt-1">Check back later for new opportunities</p>
                </div>
              ) : (deals.map((deal, i) => {
                const isAccepted = acceptedIds.has(deal.id)
                return (
                  <div key={deal.id}
                    className={`rounded-xl border transition-all duration-300 overflow-hidden ${isAccepted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'}`}
                    style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{deal.brandName}</h4>
                          <p className="text-[10px] text-nexus-400 font-mono mt-0.5">{deal.location} · {deal.category}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-base font-bold font-mono text-emerald-400">₹{deal.payout.toLocaleString('en-IN')}</p>
                          <p className="text-[8px] text-emerald-500/60 font-mono">Instant Settlement</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-nexus-300 leading-relaxed mb-3">{deal.description}</p>
                      {isAccepted ? (
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 1L6 14 2 9" /></svg>
                          Accepted — paste link below
                        </span>
                      ) : (
                        <button onClick={() => handleAccept(deal)} disabled={acceptingId === deal.id}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-mono transition-colors disabled:opacity-40 disabled:cursor-wait">
                          {acceptingId === deal.id ? 'Accepting...' : 'Accept Brief →'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              }))}
            </div>
          </div>

          <div className="separator my-1" />

          {/* Submission */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
            <h3 className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">Submission</h3>
            <p className="text-[10px] text-nexus-400 font-mono mb-3">
              {selectedDeal ? `Brief: ${selectedDeal.brandName} · ₹${selectedDeal.payout.toLocaleString('en-IN')}` : 'Accept a brief first'}
            </p>
            <div className="flex gap-2">
              <input type="url" value={link} onChange={e => setLink(e.target.value)}
                placeholder="Paste approved Instagram Reel or YouTube Short URL..."
                className="flex-1 bg-slate-950 border border-nexus-600/50 rounded-xl px-3 py-3 text-xs text-white placeholder-nexus-400 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                disabled={!selectedDeal} />
              <button onClick={handleSubmit} disabled={!selectedDeal || !link.trim() || submitting}
                className="px-5 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed font-semibold rounded-xl text-xs transition-all duration-300 font-mono flex-shrink-0">
                {submitting ? 'Submitting...' : 'Apply for Payout'}
              </button>
            </div>
            {submitMsg && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-mono animate-fade-in">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 1L6 14 2 9" /></svg>
                {submitMsg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
