import type { Partner, PartnerDeal, WebhookEvent, ApiKeyRecord, RazorpayRef, DealState, CreatorProfile, CreatorBadge, FraudReport, FraudSignal, FraudType, RiskLevel, DealFraudCheck, LedgerEntry, LedgerEntryType, PartnerBranding, WhiteLabelDashboardData } from './types'

interface ApiStoreData {
  partners: Partner[]
  deals: PartnerDeal[]
  webhooks: WebhookEvent[]
  apiKeys: ApiKeyRecord[]
  razorpayRefs: RazorpayRef[]
  creatorProfiles: CreatorProfile[]
  fraudReports: FraudReport[]
  ledger: LedgerEntry[]
  branding: Record<string, PartnerBranding>
}

const store: ApiStoreData = {
  partners: [],
  deals: [],
  webhooks: [],
  apiKeys: [],
  razorpayRefs: [],
  creatorProfiles: [],
  fraudReports: [],
  ledger: [],
  branding: {},
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

function tokenPrefix(token: string): string {
  return token.substring(0, 8)
}

function hashToken(token: string): string {
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash.toString(36)
}

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = 'sk_live_' + Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('')
  return { raw, prefix: tokenPrefix(raw), hash: hashToken(raw) }
}

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'admin_nexus_dev_key_2026'

export function validateAdminKey(raw: string): boolean {
  return raw === ADMIN_API_KEY
}

export function validateApiKey(raw: string): Partner | null {
  const prefix = tokenPrefix(raw)
  const hash = hashToken(raw)
  const key = store.apiKeys.find(k => k.prefix === prefix && k.hash === hash && k.active)
  if (!key) return null
  const partner = store.partners.find(p => p.id === key.partnerId)
  if (!partner) return null
  key.lastUsedAt = new Date().toISOString()
  return partner
}

export function createPartner(name: string, webhookUrl?: string): { partner: Partner; apiKey: string } {
  const id = generateId('part')
  const { raw, prefix, hash } = generateApiKey()
  const partner: Partner = {
    id,
    name,
    apiKeyHash: hash,
    apiKeyPrefix: prefix,
    webhookUrl: webhookUrl || null,
    webhookSecret: null,
    sandbox: false,
    createdAt: new Date().toISOString(),
  }
  const apiKey: ApiKeyRecord = {
    id: generateId('key'),
    partnerId: id,
    prefix,
    hash,
    label: 'Default',
    active: true,
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
  }
  store.partners.push(partner)
  store.apiKeys.push(apiKey)
  return { partner, apiKey: raw }
}

export function createDeal(params: {
  partnerId: string
  partnerDealId: string
  brandPhone: string
  brandName: string
  creatorUpi: string
  creatorName: string
  amount: number
  contentType: PartnerDeal['contentType']
}): PartnerDeal {
  const fee = Math.round(params.amount * 0.05)
  const deal: PartnerDeal = {
    id: generateId('deal'),
    partnerId: params.partnerId,
    partnerDealId: params.partnerDealId,
    brandPhone: params.brandPhone,
    brandName: params.brandName,
    creatorUpi: params.creatorUpi,
    creatorName: params.creatorName,
    amount: params.amount,
    fee,
    netAmount: params.amount - fee,
    state: 'pending_payment',
    paymentLink: null,
    paymentLinkId: null,
    razorpayOrderId: null,
    razorpayPayoutId: null,
    contentUrl: null,
    contentType: params.contentType,
    verifiedAt: null,
    expiredAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  store.deals.unshift(deal)
  return deal
}

export function getDeal(id: string): PartnerDeal | null {
  return store.deals.find(d => d.id === id) || null
}

export function getDealByPartnerRef(partnerId: string, partnerDealId: string): PartnerDeal | null {
  return store.deals.find(d => d.partnerId === partnerId && d.partnerDealId === partnerDealId) || null
}

export function updateDealState(id: string, state: DealState, updates?: Partial<PartnerDeal>): PartnerDeal | null {
  const deal = store.deals.find(d => d.id === id)
  if (!deal) return null
  deal.state = state
  deal.updatedAt = new Date().toISOString()
  if (updates) Object.assign(deal, updates)
  return deal
}

export function getPartnerDeals(partnerId: string): PartnerDeal[] {
  return store.deals.filter(d => d.partnerId === partnerId)
}

export function createWebhook(params: {
  partnerId: string
  dealId: string
  type: WebhookEvent['type']
  payload: Record<string, unknown>
}): WebhookEvent {
  const event: WebhookEvent = {
    id: generateId('wh'),
    partnerId: params.partnerId,
    dealId: params.dealId,
    type: params.type,
    payload: params.payload,
    status: 'pending',
    deliveredAt: null,
    retryCount: 0,
    lastError: null,
    createdAt: new Date().toISOString(),
  }
  store.webhooks.push(event)
  return event
}

export function getPendingWebhooks(): WebhookEvent[] {
  return store.webhooks.filter(w => w.status === 'pending')
}

export function markWebhookDelivered(id: string): void {
  const wh = store.webhooks.find(w => w.id === id)
  if (wh) {
    wh.status = 'delivered'
    wh.deliveredAt = new Date().toISOString()
  }
}

export function markWebhookFailed(id: string, error: string): void {
  const wh = store.webhooks.find(w => w.id === id)
  if (wh) {
    wh.retryCount += 1
    wh.lastError = error
    if (wh.retryCount >= 5) {
      wh.status = 'failed'
    }
  }
}

export function storeRazorpayRef(ref: RazorpayRef): void {
  const existing = store.razorpayRefs.findIndex(r => r.dealId === ref.dealId)
  if (existing >= 0) {
    store.razorpayRefs[existing] = ref
  } else {
    store.razorpayRefs.push(ref)
  }
}

export function getRazorpayRef(dealId: string): RazorpayRef | null {
  return store.razorpayRefs.find(r => r.dealId === dealId) || null
}

export function getPartners(): Partner[] {
  return [...store.partners]
}

export function deletePartnerData(): void {
  store.partners = []
  store.deals = []
  store.webhooks = []
  store.apiKeys = []
  store.razorpayRefs = []
  store.creatorProfiles = []
  store.fraudReports = []
  store.ledger = []
  store.branding = {}
}

// === Creator Reputation Passport ===

function computeReputationScore(profile: CreatorProfile): number {
  if (profile.dealCount === 0) return 0
  let score = 0
  score += Math.min((profile.completedDeals / Math.max(profile.dealCount, 1)) * 40, 40)
  score += Math.min(profile.onTimeRate * 20, 20)
  score += Math.min(Math.round(profile.avgEngagementRate * 5), 15)
  score += Math.min(Math.floor(profile.totalEarned / 10000), 15)
  score += Math.min(profile.badges.length * 5, 10)
  return Math.min(Math.round(score), 100)
}

function computeOnTimeRate(profile: CreatorProfile): number {
  if (profile.dealCount === 0) return 0
  const completed = profile.completedDeals
  const rejected = profile.rejectedDeals
  const total = completed + rejected
  if (total === 0) return 0
  return completed / total
}

function computeBadges(profile: CreatorProfile): CreatorBadge[] {
  const badges: CreatorBadge[] = []
  if (profile.dealCount >= 1) badges.push('verified')
  if (profile.completedDeals >= 5 && computeOnTimeRate(profile) >= 0.8) badges.push('reliable')
  if (profile.avgEngagementRate >= 4.0) badges.push('high_engagement')
  if (profile.completedDeals >= 3 && computeOnTimeRate(profile) >= 0.9) badges.push('fast_delivery')
  if (profile.completedDeals >= 10) badges.push('rising_star')
  return badges
}

export function getOrCreateCreatorProfile(upiId: string, displayName?: string, partnerId?: string): CreatorProfile {
  const existing = store.creatorProfiles.find(p => p.upiId === upiId)
  if (existing) {
    if (displayName) existing.displayName = displayName
    return existing
  }
  const profile: CreatorProfile = {
    id: generateId('crep'),
    upiId,
    displayName: displayName || upiId.split('@')[0] || 'Unknown',
    firstSeenPartnerId: partnerId || '',
    firstSeenAt: new Date().toISOString(),
    dealCount: 0,
    completedDeals: 0,
    rejectedDeals: 0,
    totalEarned: 0,
    totalFees: 0,
    avgEngagementRate: 0,
    onTimeRate: 0,
    badges: [],
    score: 0,
    lastActivityAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  store.creatorProfiles.push(profile)
  return profile
}

export function updateCreatorReputation(upiId: string, outcome: {
  completed: boolean
  amount: number
  fee: number
  engagementRate?: number
  onTime?: boolean
}): CreatorProfile | null {
  const profile = store.creatorProfiles.find(p => p.upiId === upiId)
  if (!profile) return null

  profile.dealCount += 1
  if (outcome.completed) {
    profile.completedDeals += 1
    profile.totalEarned += outcome.amount
    profile.totalFees += outcome.fee
  } else {
    profile.rejectedDeals += 1
  }

  if (outcome.engagementRate !== undefined) {
    const total = profile.completedDeals || 1
    profile.avgEngagementRate = ((profile.avgEngagementRate * (total - 1)) + outcome.engagementRate) / total
  }

  if (outcome.onTime !== undefined) {
    profile.onTimeRate = computeOnTimeRate(profile)
  }

  profile.badges = computeBadges(profile)
  profile.score = computeReputationScore(profile)
  profile.lastActivityAt = new Date().toISOString()
  profile.updatedAt = new Date().toISOString()

  return profile
}

export function getCreatorReputation(upiId: string): CreatorProfile | null {
  return store.creatorProfiles.find(p => p.upiId === upiId) || null
}

export function getAllCreatorProfiles(): CreatorProfile[] {
  return [...store.creatorProfiles]
}

export function searchCreatorProfiles(query: string): CreatorProfile[] {
  const lower = query.toLowerCase()
  return store.creatorProfiles.filter(p =>
    p.upiId.toLowerCase().includes(lower) ||
    p.displayName.toLowerCase().includes(lower)
  )
}

export function seedDemoPartner(): { partner: Partner; apiKey: string } {
  const existing = store.partners.find(p => p.name === 'Demo Localyse')
  if (existing) {
    const key = store.apiKeys.find(k => k.partnerId === existing.id && k.active)
    return { partner: existing, apiKey: key ? `sk_live_${key.prefix}...` : '' }
  }
  return createPartner('Demo Localyse', 'https://demo-localyse.webhook.example.com/hooks/nexus')
}

// === Anti-Fraud Network Effect ===

function computeFraudRiskLevel(signal: FraudSignal): RiskLevel {
  if (signal.confirmedCount >= 5 || signal.reportCount >= 10) return 'critical'
  if (signal.confirmedCount >= 2 || signal.reportCount >= 2) return 'high'
  if (signal.reportCount >= 1) return 'medium'
  return 'low'
}

function buildFraudSignal(creatorUpi: string, displayName: string): FraudSignal {
  const reports = store.fraudReports.filter(r => r.creatorUpi === creatorUpi)
  const now = Date.now()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
  const recent = reports.filter(r => r.reportedAt >= thirtyDaysAgo)
  const confirmed = reports.filter(r => r.confirmed === true)
  const fraudTypes = [...new Set(reports.map(r => r.fraudType))]
  const uniquePartners = [...new Set(reports.map(r => r.partnerId))]

  const signal: FraudSignal = {
    creatorUpi,
    displayName,
    reportCount: reports.length,
    confirmedCount: confirmed.length,
    recentReports: recent.length,
    uniquePartnerIds: uniquePartners,
    fraudTypes,
    riskLevel: 'low',
    firstFlaggedAt: reports.length > 0 ? reports.reduce((a, b) => a.reportedAt < b.reportedAt ? a : b).reportedAt : new Date().toISOString(),
    lastFlaggedAt: reports.length > 0 ? reports.reduce((a, b) => a.reportedAt > b.reportedAt ? a : b).reportedAt : new Date().toISOString(),
  }
  signal.riskLevel = computeFraudRiskLevel(signal)
  return signal
}

export function reportFraud(params: {
  partnerId: string
  dealId: string
  creatorUpi: string
  fraudType: FraudType
  description: string
  evidence?: string
  autoFlagged?: boolean
}): { report: FraudReport; signal: FraudSignal } {
  const report: FraudReport = {
    id: generateId('fraud'),
    partnerId: params.partnerId,
    dealId: params.dealId,
    creatorUpi: params.creatorUpi,
    fraudType: params.fraudType,
    description: params.description,
    evidence: params.evidence || null,
    confirmed: null,
    autoFlagged: params.autoFlagged || false,
    reportedAt: new Date().toISOString(),
    resolvedAt: null,
  }
  store.fraudReports.push(report)

  const profile = getOrCreateCreatorProfile(params.creatorUpi)
  const signal = buildFraudSignal(params.creatorUpi, profile.displayName)
  return { report, signal }
}

export function confirmFraud(fraudReportId: string, confirmed: boolean): FraudReport | null {
  const report = store.fraudReports.find(r => r.id === fraudReportId)
  if (!report) return null
  report.confirmed = confirmed
  report.resolvedAt = new Date().toISOString()
  return report
}

export function checkFraud(creatorUpi: string): DealFraudCheck {
  const profile = getCreatorReputation(creatorUpi)
  const displayName = profile?.displayName || creatorUpi.split('@')[0] || 'Unknown'
  const signal = buildFraudSignal(creatorUpi, displayName)

  let recommendation: DealFraudCheck['recommendation'] = 'allow'
  if (signal.riskLevel === 'critical') recommendation = 'block'
  else if (signal.riskLevel === 'high') recommendation = 'review'
  else if (signal.riskLevel === 'medium' && signal.confirmedCount >= 2) recommendation = 'review'

  return {
    creatorUpi,
    riskLevel: signal.riskLevel,
    signalCount: signal.reportCount,
    recentReports: signal.recentReports,
    fraudTypes: signal.fraudTypes,
    flaggedPartnerIds: signal.uniquePartnerIds,
    recommendation,
  }
}

export function getFraudSignals(): FraudSignal[] {
  const upis = [...new Set(store.fraudReports.map(r => r.creatorUpi))]
  return upis.map(upi => {
    const profile = getCreatorReputation(upi)
    return buildFraudSignal(upi, profile?.displayName || upi.split('@')[0] || 'Unknown')
  })
}

export function getFraudReports(creatorUpi?: string): FraudReport[] {
  if (creatorUpi) return store.fraudReports.filter(r => r.creatorUpi === creatorUpi)
  return [...store.fraudReports]
}

export function autoFlagRejectedDeal(deal: PartnerDeal): void {
  if (deal.state === 'rejected') {
    reportFraud({
      partnerId: deal.partnerId,
      dealId: deal.id,
      creatorUpi: deal.creatorUpi,
      fraudType: 'non_delivery',
      description: 'Auto-flagged: content verification failed or rejected by brand',
      autoFlagged: true,
    })
  }
}

// === Regulatory-Ready Ledger ===

function computeLedgerHash(entry: LedgerEntry): string {
  let h = entry.previousHash
  h += entry.dealId + entry.entryType + entry.amount + (entry.createdAt)
  let hash = 0
  for (let i = 0; i < h.length; i++) {
    const char = h.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash.toString(36).padStart(8, '0')
}

export function appendLedgerEntry(params: {
  dealId: string
  partnerId: string
  partnerDealId: string
  creatorUpi: string
  entryType: LedgerEntryType
  amount: number
  fee?: number | null
  netAmount?: number | null
  metadata?: Record<string, unknown>
}): LedgerEntry {
  const lastEntry = store.ledger[store.ledger.length - 1]
  const previousHash = lastEntry ? lastEntry.hash : 'GENESIS'

  const entry: LedgerEntry = {
    id: generateId('ledg'),
    dealId: params.dealId,
    partnerId: params.partnerId,
    partnerDealId: params.partnerDealId,
    creatorUpi: params.creatorUpi,
    entryType: params.entryType,
    amount: params.amount,
    fee: params.fee !== undefined ? params.fee : null,
    netAmount: params.netAmount !== undefined ? params.netAmount : null,
    previousHash,
    hash: '',
    metadata: params.metadata || {},
    createdAt: new Date().toISOString(),
  }
  entry.hash = computeLedgerHash(entry)
  store.ledger.push(entry)
  return entry
}

export function getDealLedger(dealId: string): LedgerEntry[] {
  return store.ledger.filter(e => e.dealId === dealId)
}

export function getLedgerEntries(params?: {
  partnerId?: string
  fromDate?: string
  toDate?: string
  entryType?: LedgerEntryType
}): LedgerEntry[] {
  let entries = [...store.ledger]
  if (params?.partnerId) entries = entries.filter(e => e.partnerId === params.partnerId)
  if (params?.entryType) entries = entries.filter(e => e.entryType === params.entryType)
  if (params?.fromDate) entries = entries.filter(e => e.createdAt >= params.fromDate!)
  if (params?.toDate) entries = entries.filter(e => e.createdAt <= params.toDate!)
  return entries
}

export function verifyLedgerChain(): { valid: boolean; entriesChecked: number; firstBreakIndex: number | null } {
  for (let i = 0; i < store.ledger.length; i++) {
    const entry = store.ledger[i]
    const expectedPrev = i === 0 ? 'GENESIS' : store.ledger[i - 1].hash
    if (entry.previousHash !== expectedPrev) {
      return { valid: false, entriesChecked: i, firstBreakIndex: i }
    }
    const expectedHash = computeLedgerHash(entry)
    if (entry.hash !== expectedHash) {
      return { valid: false, entriesChecked: i, firstBreakIndex: i }
    }
  }
  return { valid: true, entriesChecked: store.ledger.length, firstBreakIndex: null }
}

export function getLedgerHashChainSummary(): { totalEntries: number; firstHash: string; lastHash: string; createdAt: string; updatedAt: string } {
  if (store.ledger.length === 0) {
    return { totalEntries: 0, firstHash: 'GENESIS', lastHash: 'GENESIS', createdAt: '', updatedAt: '' }
  }
  return {
    totalEntries: store.ledger.length,
    firstHash: store.ledger[0].hash,
    lastHash: store.ledger[store.ledger.length - 1].hash,
    createdAt: store.ledger[0].createdAt,
    updatedAt: store.ledger[store.ledger.length - 1].createdAt,
  }
}

// === White-Label Dashboard ===

export function setPartnerBranding(partnerId: string, branding: {
  companyName: string
  logoUrl?: string | null
  primaryColor?: string
  faviconUrl?: string | null
  domain?: string | null
  supportEmail?: string | null
  customCss?: string | null
}): PartnerBranding {
  const existing = store.branding[partnerId]
  const now = new Date().toISOString()

  const updated: PartnerBranding = {
    partnerId,
    companyName: branding.companyName,
    logoUrl: branding.logoUrl !== undefined ? branding.logoUrl : existing?.logoUrl || null,
    primaryColor: branding.primaryColor || existing?.primaryColor || '#6366f1',
    faviconUrl: branding.faviconUrl !== undefined ? branding.faviconUrl : existing?.faviconUrl || null,
    domain: branding.domain !== undefined ? branding.domain : existing?.domain || null,
    supportEmail: branding.supportEmail !== undefined ? branding.supportEmail : existing?.supportEmail || null,
    customCss: branding.customCss !== undefined ? branding.customCss : existing?.customCss || null,
    updatedAt: now,
  }

  store.branding[partnerId] = updated
  return updated
}

export function getPartnerBranding(partnerId: string): PartnerBranding | null {
  return store.branding[partnerId] || null
}

export function getWhiteLabelDashboard(partnerId: string): WhiteLabelDashboardData | null {
  const partner = store.partners.find(p => p.id === partnerId)
  if (!partner) return null

  const branding = store.branding[partnerId]
  const partnerDeals = getPartnerDeals(partnerId)

  const activeDeals = partnerDeals.filter(d =>
    d.state === 'pending_payment' || d.state === 'payment_received' || d.state === 'content_submitted'
  )
  const completedDeals = partnerDeals.filter(d => d.state === 'verified')
  const rejectedDeals = partnerDeals.filter(d => d.state === 'rejected')

  const totalVolume = partnerDeals.reduce((sum, d) => sum + d.amount, 0)
  const totalFees = partnerDeals.reduce((sum, d) => sum + d.fee, 0)
  const verifiedCount = completedDeals.length + rejectedDeals.length
  const verifiedRate = verifiedCount > 0
    ? Math.round((completedDeals.length / verifiedCount) * 10000) / 100
    : 0

  return {
    partner: {
      name: branding?.companyName || partner.name,
      logo_url: branding?.logoUrl || null,
      primary_color: branding?.primaryColor || '#6366f1',
      domain: branding?.domain || null,
      support_email: branding?.supportEmail || null,
    },
    stats: {
      total_deals: partnerDeals.length,
      active_deals: activeDeals.length,
      completed_deals: completedDeals.length,
      total_volume: totalVolume,
      total_fees: totalFees,
      verified_rate: verifiedRate,
    },
    recent_deals: partnerDeals.slice(0, 10).map(d => ({
      id: d.id,
      creator_name: d.creatorName,
      creator_upi: d.creatorUpi,
      amount: d.amount,
      state: d.state,
      created_at: d.createdAt,
    })),
    version: '1.0.0',
  }
}

// === Auto-Refund Timer ===

export function checkExpiredDeals(): { refunded: number; expired: number } {
  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  let refunded = 0
  let expired = 0

  for (const deal of store.deals) {
    if (deal.state !== 'payment_received') continue

    const createdAt = new Date(deal.createdAt).getTime()
    if (now - createdAt >= sevenDays) {
      updateDealState(deal.id, 'refunded', { expiredAt: new Date().toISOString() })

      appendLedgerEntry({
        dealId: deal.id,
        partnerId: deal.partnerId,
        partnerDealId: deal.partnerDealId,
        creatorUpi: deal.creatorUpi,
        entryType: 'refund_issued',
        amount: deal.amount,
        fee: 0,
        netAmount: deal.amount,
        metadata: { reason: 'auto_refund_7_day_timeout' },
      })

      createWebhook({
        partnerId: deal.partnerId,
        dealId: deal.id,
        type: 'deal.refunded',
        payload: {
          deal_id: deal.id,
          partner_deal_id: deal.partnerDealId,
          reason: 'auto_refund_7_day_timeout',
          refunded_at: new Date().toISOString(),
        },
      })

      refunded++
    }
  }

  return { refunded, expired }
}

// === Webhook Monitoring ===

export function getWebhookDeliveryStatus(): {
  total: number
  pending: number
  delivered: number
  failed: number
  retryQueue: { id: string; dealId: string; type: string; retryCount: number; lastError: string | null; createdAt: string }[]
} {
  const pending = store.webhooks.filter(w => w.status === 'pending')
  const delivered = store.webhooks.filter(w => w.status === 'delivered')
  const failed = store.webhooks.filter(w => w.status === 'failed')

  return {
    total: store.webhooks.length,
    pending: pending.length,
    delivered: delivered.length,
    failed: failed.length,
    retryQueue: pending.map(w => ({
      id: w.id,
      dealId: w.dealId,
      type: w.type,
      retryCount: w.retryCount,
      lastError: w.lastError,
      createdAt: w.createdAt,
    })),
  }
}
