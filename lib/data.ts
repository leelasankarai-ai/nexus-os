import { TDS_RATE, type Campaign, type Deal, type Submission, type Creator, type Notification, type Transaction, type CampaignTier, type CampaignStatus, type VerificationStatus, type Badge, type MilestonePhase } from './types'

const TIER_REGIONS: Record<string, string[]> = {
  tier1: ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'],
  tier2: ['Jaipur', 'Lucknow', 'Surat', 'Indore', 'Bhopal', 'Nagpur', 'Visakhapatnam', 'Vadodara', 'Patna', 'Coimbatore'],
  tier3: ['Guwahati', 'Kochi', 'Chandigarh', 'Raipur', 'Ranchi', 'Bhubaneswar', 'Mysuru', 'Nashik', 'Aurangabad', 'Varanasi', 'Amritsar', 'Udaipur'],
  local_biz: ['Kakinada Jilla', 'Rajamahendravaram Hubs', 'East Godavari Clusters'],
}

const NICHES = ['Tech', 'FinTech', 'Fashion', 'FMCG', 'B2B', 'Lifestyle', 'Fitness', 'Food', 'Travel', 'Gaming']

const MOCK: {
  campaigns: Campaign[]
  deals: Deal[]
  submissions: Submission[]
  creators: Creator[]
  notifications: Notification[]
  transactions: Transaction[]
  wallet: number
} = {
  campaigns: [
    { id: 'cmp-1', brandName: 'Urban Threads', name: 'National Summer Collection Drop', budget: 4500000, tier: 'tier1', region: 'Mumbai', status: 'escrow_funded', impressions: 2840000, activeCreators: 48, escrowBalance: 2250000, ageMin: 18, ageMax: 35, targetNiches: ['Fashion', 'Lifestyle'], minER: 4.5, createdAt: '2026-06-10', deadline: '2026-07-25', milestones: { script: true } },
    { id: 'cmp-2', brandName: 'Fresh Roots Organics', name: 'Farm-to-Table National Push', budget: 1800000, tier: 'tier2', region: 'Lucknow', status: 'audience_matched', impressions: 892000, activeCreators: 24, escrowBalance: 1800000, ageMin: 25, ageMax: 45, targetNiches: ['Food', 'Fitness', 'Lifestyle'], minER: 3.2, createdAt: '2026-06-14', deadline: '2026-07-30', milestones: { script: true, content: true } },
    { id: 'cmp-3', brandName: 'TechStudio India', name: 'Gadget Launch Wave', budget: 8000000, tier: 'tier1', region: 'Bengaluru', status: 'payout_locked', impressions: 4100000, activeCreators: 72, escrowBalance: 4000000, ageMin: 18, ageMax: 40, targetNiches: ['Tech', 'FinTech', 'Gaming'], minER: 5.0, createdAt: '2026-06-08', deadline: '2026-07-20' },
    { id: 'cmp-4', brandName: 'Heritage Crafts Co', name: 'Handloom Revival Campaign', budget: 750000, tier: 'tier3', region: 'Jaipur', status: 'escrow_funded', impressions: 345000, activeCreators: 12, escrowBalance: 750000, ageMin: 22, ageMax: 50, targetNiches: ['Fashion', 'Lifestyle'], minER: 2.8, createdAt: '2026-06-18', deadline: '2026-08-01', milestones: {} },
    { id: 'cmp-5', brandName: 'QuickBite Foods', name: 'Festival Feast Campaign', budget: 3200000, tier: 'tier2', region: 'Patna', status: 'campaign_completed', impressions: 5670000, activeCreators: 90, escrowBalance: 0, ageMin: 18, ageMax: 55, targetNiches: ['Food', 'FMCG'], minER: 3.0, createdAt: '2026-05-20', deadline: '2026-07-05', milestones: { script: true, content: true, views: true } },
    { id: 'cmp-6', brandName: 'FinEdge Capital', name: 'UPI & Investment Awareness', budget: 5500000, tier: 'tier1', region: 'Delhi NCR', status: 'escrow_funded', impressions: 0, activeCreators: 0, escrowBalance: 5500000, ageMin: 21, ageMax: 45, targetNiches: ['FinTech', 'Tech', 'B2B'], minER: 4.0, createdAt: '2026-06-22', deadline: '2026-08-10', milestones: {} },
    { id: 'cmp-7', brandName: 'Kakinada Fresh Mart', name: 'Local Veggie Delivery Push', budget: 5000, tier: 'local_biz', region: 'Kakinada Jilla', status: 'escrow_funded', impressions: 12000, activeCreators: 3, escrowBalance: 5000, ageMin: 18, ageMax: 55, targetNiches: ['Food', 'FMCG', 'Lifestyle'], minER: 2.0, createdAt: '2026-06-20', deadline: '2026-07-10', milestones: {} },
  ],
  deals: [
    { id: 'deal-1', campaignId: 'cmp-1', brandName: 'Urban Threads', location: 'Mumbai', payout: 45000, description: 'National campaign: 60s styling reel featuring 5 summer looks from our premium collection. Must show transition between casual to festive wear.', status: 'open', category: 'fashion' },
    { id: 'deal-2', campaignId: 'cmp-1', brandName: 'Urban Threads', location: 'Delhi NCR', payout: 55000, description: 'Festive season lookbook shoot — 8-10 premium ethnic outfits. Need high-production value with at least 3 location changes.', status: 'open', category: 'fashion' },
    { id: 'deal-3', campaignId: 'cmp-2', brandName: 'Fresh Roots Organics', location: 'Lucknow', payout: 28000, description: 'Farm-to-table documentary style reel showing organic farming process. Must include farmer interview and product harvest shots.', status: 'open', category: 'food' },
    { id: 'deal-4', campaignId: 'cmp-3', brandName: 'TechStudio India', location: 'Bengaluru', payout: 85000, description: 'Flagship gadget unboxing + 7-day review. Must include speed tests, camera comparison, and battery drain benchmark.', status: 'open', category: 'tech' },
    { id: 'deal-5', campaignId: 'cmp-4', brandName: 'Heritage Crafts Co', location: 'Jaipur', payout: 22000, description: 'Handicraft making process video featuring block printing or blue pottery. Must include artisan interview.', status: 'open', category: 'crafts' },
    { id: 'deal-6', campaignId: 'cmp-6', brandName: 'FinEdge Capital', location: 'Delhi NCR', payout: 65000, description: 'UPI safety explainer: 90-120s animated/whiteboard style video. Must cover fraud protection and investment basics.', status: 'open', category: 'tech' },
    { id: 'deal-7', campaignId: 'cmp-7', brandName: 'Kakinada Fresh Mart', location: 'Kakinada Jilla', payout: 2500, description: 'Local veggie unboxing reel in Telugu — 30-45s showcasing fresh farm produce delivered to your door. Must mention Kakinada area.', status: 'open', category: 'food' },
  ],
  submissions: [
    {
      id: 'sub-1', dealId: 'deal-1', campaignId: 'cmp-1', brandName: 'Urban Threads',
      creatorName: 'Priya Sharma', creatorId: 'creator-1', payout: 45000,
      url: 'https://instagram.com/reel/xyz123', status: 'verified',
      erResult: { passed: true, er: 6.2, baseline: 4.5, engagement: 12400, followers: 200000 },
      geoResult: { passed: true, matchPercent: 78, targetState: 'Maharashtra', topCities: ['Mumbai', 'Pune', 'Nashik'] },
      botResult: { passed: true, spikeScore: 12, botCommentRatio: 3.2, flags: [] },
      submittedAt: '2026-06-21T10:30:00Z', verifiedAt: '2026-06-22T14:00:00Z',
    },
    {
      id: 'sub-2', dealId: 'deal-2', campaignId: 'cmp-1', brandName: 'Urban Threads',
      creatorName: 'Arjun Reddy', creatorId: 'creator-2', payout: 55000,
      url: 'https://instagram.com/reel/abc456', status: 'flagged',
      erResult: { passed: false, er: 2.1, baseline: 4.5, engagement: 3200, followers: 152000 },
      geoResult: { passed: true, matchPercent: 65, targetState: 'Delhi', topCities: ['Delhi', 'Gurugram', 'Noida'] },
      botResult: { passed: false, spikeScore: 67, botCommentRatio: 18.5, flags: ['Follower spike detected Jun 2026', 'High ratio of generic comments (18.5%)', 'Engagement rate below threshold'] },
      submittedAt: '2026-06-21T14:00:00Z',
    },
    {
      id: 'sub-3', dealId: 'deal-3', campaignId: 'cmp-2', brandName: 'Fresh Roots Organics',
      creatorName: 'Neha Gupta', creatorId: 'creator-1', payout: 28000,
      url: 'https://youtube.com/watch?v=def789', status: 'pending',
      erResult: { passed: true, er: 5.8, baseline: 3.2, engagement: 8900, followers: 153000 },
      geoResult: { passed: false, matchPercent: 32, targetState: 'Uttar Pradesh', topCities: ['Lucknow', 'Kanpur', 'Varanasi'] },
      botResult: { passed: true, spikeScore: 8, botCommentRatio: 2.1, flags: [] },
      submittedAt: '2026-06-23T09:15:00Z',
    },
    {
      id: 'sub-4', dealId: 'deal-4', campaignId: 'cmp-3', brandName: 'TechStudio India',
      creatorName: 'Rahul Verma', creatorId: 'creator-2', payout: 85000,
      url: 'https://youtube.com/watch?v=ghi012', status: 'verified',
      erResult: { passed: true, er: 8.1, baseline: 5.0, engagement: 28500, followers: 352000 },
      geoResult: { passed: true, matchPercent: 82, targetState: 'Karnataka', topCities: ['Bengaluru', 'Mysuru', 'Hubballi'] },
      botResult: { passed: true, spikeScore: 5, botCommentRatio: 1.8, flags: [] },
      submittedAt: '2026-06-22T16:45:00Z', verifiedAt: '2026-06-23T11:30:00Z',
    },
  ],
  creators: [
    { id: 'creator-1', name: 'Priya Sharma', email: 'creator@nexus.io', wallet: 148500, totalEarned: 485000, completedDeals: 24, rating: 4.8, reputationScore: 82, badges: [
      { id: 'badge-5deals', name: 'Rising Star', description: 'Completed 5 deals', icon: '⭐', unlockedAt: '2026-03-15T10:00:00Z' },
      { id: 'badge-10deals', name: 'Top Creator', description: 'Completed 10 deals', icon: '🏆', unlockedAt: '2026-04-20T14:30:00Z' },
      { id: 'badge-earn1l', name: '₹1L Earner', description: 'Cumulative earnings over ₹1,00,000', icon: '💰', unlockedAt: '2026-02-10T08:00:00Z' },
      { id: 'badge-earn5l', name: '₹5L Earner', description: 'Cumulative earnings over ₹5,00,000', icon: '💎', unlockedAt: '2026-05-01T16:00:00Z' },
    ]},
    { id: 'creator-2', name: 'Arjun Reddy', email: 'arjun@nexus.io', wallet: 72000, totalEarned: 215000, completedDeals: 15, rating: 4.2, reputationScore: 65, badges: [
      { id: 'badge-5deals', name: 'Rising Star', description: 'Completed 5 deals', icon: '⭐', unlockedAt: '2026-04-10T12:00:00Z' },
      { id: 'badge-10deals', name: 'Top Creator', description: 'Completed 10 deals', icon: '🏆', unlockedAt: '2026-05-25T09:00:00Z' },
      { id: 'badge-earn1l', name: '₹1L Earner', description: 'Cumulative earnings over ₹1,00,000', icon: '💰', unlockedAt: '2026-04-15T11:00:00Z' },
    ]},
  ],
  notifications: [
    { id: 'notif-1', userId: 'brand-1', message: 'Campaign "Summer Drop" crossed 2.8M impressions!', type: 'milestone', read: false, timestamp: '2026-06-23T08:00:00Z' },
    { id: 'notif-2', userId: 'creator-1', message: '₹45,000 payout verified — releasing to wallet', type: 'payout', read: false, timestamp: '2026-06-23T07:30:00Z' },
    { id: 'notif-3', userId: 'admin-1', message: 'New submission from Arjun Reddy flagged — ER below threshold', type: 'flag', read: false, timestamp: '2026-06-23T07:00:00Z' },
  ],
  transactions: [
    { id: 'txn-001', type: 'deposit', amount: 4500000, from: 'Urban Threads', to: 'Escrow Pool', status: 'completed', timestamp: '2026-06-10T10:00:00Z' },
    { id: 'txn-002', type: 'payout', amount: 45000, from: 'Escrow Pool', to: 'Priya Sharma', status: 'completed', timestamp: '2026-06-22T14:00:00Z' },
  ],
  wallet: 148500,
}

// === Campaign Operations ===

export function getCampaigns() {
  return [...MOCK.campaigns]
}

export function createCampaign(data: Partial<Campaign> & { brandName: string; name: string; budget: number; tier: CampaignTier }) {
  const campaign: Campaign = {
    id: `cmp-${Date.now()}`,
    brandName: data.brandName,
    name: data.name,
    budget: Number(data.budget),
    tier: data.tier,
    region: data.region || TIER_REGIONS[data.tier]?.[0] || 'Mumbai',
    status: 'escrow_funded',
    impressions: 0,
    activeCreators: 0,
    escrowBalance: Number(data.budget),
    ageMin: data.ageMin || 18,
    ageMax: data.ageMax || 45,
    targetNiches: data.targetNiches || [],
    minER: data.minER || 3.0,
    createdAt: new Date().toISOString().split('T')[0],
    deadline: data.deadline || new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
    milestones: {},
  }
  MOCK.campaigns.unshift(campaign)
  const transaction: Transaction = {
    id: `txn-${Date.now()}`, type: 'deposit', amount: campaign.budget,
    from: campaign.brandName, to: 'Escrow Pool', status: 'completed', timestamp: new Date().toISOString(),
  }
  MOCK.transactions.push(transaction)
  broadcast({ type: 'createCampaign', campaign, transaction })
  return campaign
}

export function getTierRegions() { return TIER_REGIONS }
export function getNiches() { return [...NICHES] }

// === Deal Operations ===

export function getDeals() { return [...MOCK.deals] }
export function acceptDeal(dealId: string, creatorId: string) {
  const deal = MOCK.deals.find(d => d.id === dealId)
  if (!deal) throw new Error('Deal not found')
  if (deal.status !== 'open') throw new Error('Deal already taken')
  deal.status = 'accepted'
  deal.creatorId = creatorId
  broadcast({ type: 'acceptDeal', dealId, creatorId })
  return deal
}

export function submitDealContent(dealId: string, creatorId: string, url: string) {
  const deal = MOCK.deals.find(d => d.id === dealId)
  if (!deal) throw new Error('Deal not found')
  if (deal.status !== 'accepted') throw new Error('Must accept deal first')
  deal.status = 'submitted'
  deal.submittedUrl = url
  deal.submittedAt = new Date().toISOString()

  const er = Number((Math.random() * 8 + 1).toFixed(1))
  const matchPercent = Math.floor(Math.random() * 60) + 30
  const spikeScore = Math.floor(Math.random() * 80)
  const botRatio = Number((Math.random() * 20).toFixed(1))

  const submission: Submission = {
    id: `sub-${Date.now()}`,
    dealId, campaignId: deal.campaignId,
    brandName: deal.brandName,
    creatorName: MOCK.creators.find(c => c.id === creatorId)?.name || 'Unknown',
    creatorId, payout: deal.payout, url,
    status: 'pending',
    erResult: { passed: er >= 3.0, er, baseline: 3.0, engagement: Math.floor(Math.random() * 30000) + 1000, followers: Math.floor(Math.random() * 500000) + 10000 },
    geoResult: { passed: matchPercent >= 40, matchPercent, targetState: deal.location, topCities: [deal.location, 'City A', 'City B'] },
    botResult: { passed: spikeScore < 40 && botRatio < 10, spikeScore, botCommentRatio: botRatio, flags: spikeScore >= 40 ? ['Follower growth anomaly detected'] : [] },
    submittedAt: new Date().toISOString(),
  }
  MOCK.submissions.unshift(submission)
  const notification: Notification = {
    id: `notif-${Date.now()}`, userId: 'admin-1',
    message: `New submission: ${deal.brandName} — ${submission.creatorName} (₹${deal.payout.toLocaleString('en-IN')})`,
    type: 'submission', read: false, timestamp: new Date().toISOString(),
  }
  MOCK.notifications.push(notification)
  broadcast({ type: 'submitContent', submission, notification })
  return submission
}

// === Verification Operations ===

export function getSubmissions() { return [...MOCK.submissions] }

export function verifySubmission(subId: string) {
  const sub = MOCK.submissions.find(s => s.id === subId)
  if (!sub) throw new Error('Submission not found')
  sub.status = 'verified'
  sub.verifiedAt = new Date().toISOString()

  const creator = MOCK.creators.find(c => c.id === sub.creatorId)
  if (creator) {
    creator.wallet += sub.payout
    creator.totalEarned += sub.payout
    creator.completedDeals += 1
    const newBadges = checkBadges(creator.id)
    computeReputation(creator.id)
    if (newBadges.length > 0) {
      MOCK.notifications.push({
        id: `notif-${Date.now()}`, userId: creator.id,
        message: `New badge unlocked: ${newBadges.map(b => b.name).join(', ')}!`,
        type: 'milestone', read: false, timestamp: new Date().toISOString(),
      })
    }
  }

  const campaign = MOCK.campaigns.find(c => c.id === sub.campaignId)
  if (campaign) {
    campaign.escrowBalance = Math.max(0, campaign.escrowBalance - sub.payout)
    campaign.impressions += Math.floor(Math.random() * 500000) + 50000
    campaign.activeCreators += 1
  }

  const deal = MOCK.deals.find(d => d.id === sub.dealId)
  if (deal) deal.status = 'paid'

  const transaction: Transaction = {
    id: `txn-${Date.now()}`, type: 'payout', amount: sub.payout,
    from: 'Escrow Pool', to: sub.creatorName, status: 'completed', timestamp: new Date().toISOString(),
  }
  MOCK.transactions.push(transaction)

  broadcast({
    type: 'verifySubmission',
    subId,
    creatorUpdate: creator ? { wallet: creator.wallet, totalEarned: creator.totalEarned, completedDeals: creator.completedDeals } : { wallet: 0, totalEarned: 0, completedDeals: 0 },
    campaignUpdate: campaign ? { escrowBalance: campaign.escrowBalance, impressions: campaign.impressions, activeCreators: campaign.activeCreators } : { escrowBalance: 0, impressions: 0, activeCreators: 0 },
    transaction,
    dealId: sub.dealId,
  })

  return sub
}

export function getCreators() { return [...MOCK.creators] }
export function getCreator(id: string) { return MOCK.creators.find(c => c.id === id) || null }

export function getWallet() { return MOCK.wallet }

export function withdrawAll() {
  const amount = MOCK.wallet
  MOCK.wallet = 0
  const transaction: Transaction = {
    id: `txn-${Date.now()}`, type: 'withdrawal', amount,
    from: 'Creator Wallet', to: 'Bank Account (UPI)', status: 'completed', timestamp: new Date().toISOString(),
  }
  MOCK.transactions.push(transaction)
  broadcast({ type: 'withdrawAll', amount, transaction })
  return amount
}

// === TDS & Tax ===

export function computeTDS(amount: number) {
  return Math.round(amount * TDS_RATE)
}

export function computeNetPayout(amount: number) {
  return amount - computeTDS(amount)
}

// === Predictive Reach ===

export function predictReach(budget: number) {
  const base = budget / 4
  const variance = base * 0.3
  const low = Math.round(base - variance)
  const high = Math.round(base + variance)
  const roi = Number((2.5 + Math.random() * 1.8).toFixed(1))
  return { estimatedImpressions: { low, high }, projectedROI: roi }
}

// === Milestones ===

export function advanceMilestone(campaignId: string, phase: MilestonePhase) {
  const campaign = MOCK.campaigns.find(c => c.id === campaignId)
  if (!campaign) return null
  if (!campaign.milestones) campaign.milestones = {}
  campaign.milestones[phase] = true
  const allDone = ['script', 'content', 'views'].every(p => campaign.milestones![p as MilestonePhase])
  if (allDone) campaign.status = 'campaign_completed'
  return campaign
}

// === Reputation & Badges ===

const BADGE_DEFS: Array<{ id: string; name: string; description: string; icon: string; check: (c: Creator) => boolean }> = [
  { id: 'badge-first', name: 'First Deal', description: 'Completed your first deal', icon: '🎯', check: c => c.completedDeals >= 1 },
  { id: 'badge-5deals', name: 'Rising Star', description: 'Completed 5 deals', icon: '⭐', check: c => c.completedDeals >= 5 },
  { id: 'badge-10deals', name: 'Top Creator', description: 'Completed 10 deals', icon: '🏆', check: c => c.completedDeals >= 10 },
  { id: 'badge-25deals', name: 'Veteran', description: 'Completed 25 deals', icon: '👑', check: c => c.completedDeals >= 25 },
  { id: 'badge-earn1l', name: '₹1L Earner', description: 'Cumulative earnings over ₹1,00,000', icon: '💰', check: c => c.totalEarned >= 100000 },
  { id: 'badge-earn5l', name: '₹5L Earner', description: 'Cumulative earnings over ₹5,00,000', icon: '💎', check: c => c.totalEarned >= 500000 },
  { id: 'badge-earn10l', name: '₹10L Earner', description: 'Cumulative earnings over ₹10,00,000', icon: '💎', check: c => c.totalEarned >= 1000000 },
  { id: 'badge-rating', name: 'Perfect Engagement', description: 'Maintained 4.5+ rating across deals', icon: '📈', check: c => c.rating >= 4.5 },
]

export function checkBadges(creatorId: string): Badge[] {
  const creator = MOCK.creators.find(c => c.id === creatorId)
  if (!creator) return []

  const unlocked: Badge[] = []
  for (const def of BADGE_DEFS) {
    const already = creator.badges.find(b => b.id === def.id)
    if (already) continue
    if (def.check(creator)) {
      const badge: Badge = { ...def, unlockedAt: new Date().toISOString() }
      creator.badges.push(badge)
      unlocked.push(badge)
    }
  }
  return unlocked
}

export function computeReputation(creatorId: string): number {
  const creator = MOCK.creators.find(c => c.id === creatorId)
  if (!creator) return 0

  let score = 0
  score += Math.min(creator.completedDeals * 3, 30)
  score += Math.min(Math.floor(creator.totalEarned / 50000), 25)
  score += Math.min(Math.round(creator.rating * 5), 25)
  score += Math.min(creator.badges.length * 4, 20)
  creator.reputationScore = Math.min(score, 100)
  return creator.reputationScore
}

export function getBadges(creatorId: string): Badge[] {
  const creator = MOCK.creators.find(c => c.id === creatorId)
  return creator ? [...creator.badges] : []
}

export function getBadgeDefs() {
  return BADGE_DEFS.map(({ id, name, description, icon }) => ({ id, name, description, icon }))
}

export function getNotifications() { return [...MOCK.notifications] }
export function getTransactions() { return [...MOCK.transactions] }
export function getMetrics() {
  const c = MOCK.campaigns
  return {
    totalImpressions: c.reduce((s, x) => s + x.impressions, 0),
    totalCreators: c.reduce((s, x) => s + x.activeCreators, 0),
    totalEscrow: c.reduce((s, x) => s + x.escrowBalance, 0),
    activeCampaigns: c.filter(x => x.status !== 'campaign_completed').length,
    totalBudget: c.reduce((s, x) => s + x.budget, 0),
    totalTransactedCapital: c.reduce((s, x) => s + (x.status !== 'draft' ? x.budget : 0), 0),
  }
}

// === Cross-Tab State Sync (BroadcastChannel) ===

type SyncMessage =
  | { type: 'createCampaign'; campaign: Campaign; transaction: Transaction }
  | { type: 'acceptDeal'; dealId: string; creatorId: string }
  | { type: 'submitContent'; submission: Submission; notification: Notification }
  | { type: 'verifySubmission'; subId: string; creatorUpdate: { wallet: number; totalEarned: number; completedDeals: number }; campaignUpdate: { escrowBalance: number; impressions: number; activeCreators: number }; transaction: Transaction; dealId: string }
  | { type: 'withdrawAll'; amount: number; transaction: Transaction }
  | { type: 'simTick'; impressions: Array<{ id: string; value: number }> }

let channel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel | null {
  if (channel) return channel
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('nexus-os-sync')
    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const msg = event.data
      switch (msg.type) {
        case 'createCampaign': {
          MOCK.campaigns.unshift(msg.campaign)
          MOCK.transactions.push(msg.transaction)
          break
        }
        case 'acceptDeal': {
          const deal = MOCK.deals.find(d => d.id === msg.dealId)
          if (deal) { deal.status = 'accepted'; deal.creatorId = msg.creatorId }
          break
        }
        case 'submitContent': {
          MOCK.submissions.unshift(msg.submission)
          MOCK.notifications.push(msg.notification)
          const d = MOCK.deals.find(x => x.id === msg.submission.dealId)
          if (d) { d.status = 'submitted'; d.submittedUrl = msg.submission.url; d.submittedAt = msg.submission.submittedAt }
          break
        }
        case 'verifySubmission': {
          const sub = MOCK.submissions.find(s => s.id === msg.subId)
          if (sub) { sub.status = 'verified'; sub.verifiedAt = new Date().toISOString() }
          const c = MOCK.creators.find(x => x.id === (sub?.creatorId || ''))
          if (c) { c.wallet = msg.creatorUpdate.wallet; c.totalEarned = msg.creatorUpdate.totalEarned; c.completedDeals = msg.creatorUpdate.completedDeals }
          const camp = MOCK.campaigns.find(x => x.id === (sub?.campaignId || ''))
          if (camp) { camp.escrowBalance = msg.campaignUpdate.escrowBalance; camp.impressions = msg.campaignUpdate.impressions; camp.activeCreators = msg.campaignUpdate.activeCreators }
          const d = MOCK.deals.find(x => x.id === msg.dealId)
          if (d) d.status = 'paid'
          MOCK.transactions.push(msg.transaction)
          break
        }
        case 'withdrawAll': {
          MOCK.wallet = 0
          MOCK.transactions.push(msg.transaction)
          break
        }
        case 'simTick': {
          msg.impressions.forEach(({ id, value }) => {
            const c = MOCK.campaigns.find(x => x.id === id)
            if (c) c.impressions = value
          })
          break
        }
      }
      listeners.forEach(fn => fn())
    }
  }
  return channel
}

function broadcast(msg: SyncMessage) {
  const ch = getChannel()
  if (ch) ch.postMessage(msg)
}

// === Simulation ===

let listeners: Array<() => void> = []
export function subscribe(fn: () => void) {
  listeners.push(fn)
  return () => { listeners = listeners.filter(l => l !== fn) }
}

export function startSim() {
  if (typeof window === 'undefined' || (window as any).__nexusSim) return;
  (window as any).__nexusSim = setInterval(() => {
    const impressions: Array<{ id: string; value: number }> = []
    MOCK.campaigns.forEach(c => {
      if (c.status !== 'campaign_completed') {
        c.impressions += Math.floor(Math.random() * 500) + 100
        impressions.push({ id: c.id, value: c.impressions })
      }
    })
    if (impressions.length > 0) {
      broadcast({ type: 'simTick', impressions })
    }
    listeners.forEach(fn => fn())
  }, 3000)
}

export function stopSim() {
  if (typeof window !== 'undefined' && (window as any).__nexusSim) {
    clearInterval((window as any).__nexusSim);
    (window as any).__nexusSim = null
  }
}
