export type UserRole = 'brand' | 'creator' | 'admin'
export type KycTier = 'guest' | 'basic' | 'verified' | 'business'
export type CampaignTier = 'tier1' | 'tier2' | 'tier3' | 'local_biz'
export type CampaignStatus = 'draft' | 'escrow_funded' | 'audience_matched' | 'payout_locked' | 'campaign_completed'
export type DealStatus = 'open' | 'accepted' | 'submitted' | 'verified' | 'paid'
export type VerificationStatus = 'pending' | 'verified' | 'flagged' | 'paid'

export const TDS_RATE = 0.01

export type MilestonePhase = 'script' | 'content' | 'views'

export const MILESTONE_PIPELINE: { phase: MilestonePhase; label: string; share: number }[] = [
  { phase: 'script', label: 'Script Approved', share: 20 },
  { phase: 'content', label: 'Live Content Post', share: 50 },
  { phase: 'views', label: 'View Target Hit', share: 30 },
]

export interface Campaign {
  id: string
  brandName: string
  name: string
  budget: number
  tier: CampaignTier
  region: string
  status: CampaignStatus
  impressions: number
  activeCreators: number
  escrowBalance: number
  ageMin: number
  ageMax: number
  targetNiches: string[]
  minER: number
  createdAt: string
  deadline: string
  milestones?: Partial<Record<MilestonePhase, boolean>>
}

export interface Deal {
  id: string
  campaignId: string
  brandName: string
  location: string
  payout: number
  description: string
  status: DealStatus
  category: string
  creatorId?: string
  submittedUrl?: string
  submittedAt?: string
}

export interface Submission {
  id: string
  dealId: string
  campaignId: string
  brandName: string
  creatorName: string
  creatorId: string
  payout: number
  url: string
  status: VerificationStatus
  erResult: { passed: boolean; er: number; baseline: number; engagement: number; followers: number }
  geoResult: { passed: boolean; matchPercent: number; targetState: string; topCities: string[] }
  botResult: { passed: boolean; spikeScore: number; botCommentRatio: number; flags: string[] }
  submittedAt: string
  verifiedAt?: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
}

export interface Creator {
  id: string
  name: string
  email: string
  wallet: number
  totalEarned: number
  completedDeals: number
  rating: number
  reputationScore: number
  badges: Badge[]
}

export interface Notification {
  id: string
  userId: string
  message: string
  type: string
  read: boolean
  timestamp: string
}

export interface Transaction {
  id: string
  type: 'deposit' | 'payout' | 'withdrawal'
  amount: number
  from: string
  to: string
  status: string
  timestamp: string
  razorpayRef?: string
}

export interface Session {
  id: string
  email: string
  name: string
  role: UserRole
  avatar: string
  wallet?: number
  kycTier: KycTier
  token: string
}

// === API-First Partner Model ===

export type DealState = 'pending_payment' | 'payment_received' | 'content_submitted' | 'verified' | 'rejected' | 'refunded' | 'expired'

export interface Partner {
  id: string
  name: string
  apiKeyHash: string
  apiKeyPrefix: string
  webhookUrl: string | null
  webhookSecret: string | null
  sandbox: boolean
  createdAt: string
}

export interface PartnerDeal {
  id: string
  partnerId: string
  partnerDealId: string
  brandPhone: string
  brandName: string
  creatorUpi: string
  creatorName: string
  amount: number
  fee: number
  netAmount: number
  state: DealState
  paymentLink: string | null
  paymentLinkId: string | null
  razorpayOrderId: string | null
  razorpayPayoutId: string | null
  contentUrl: string | null
  contentType: 'instagram_reel' | 'youtube_short' | 'other'
  verifiedAt: string | null
  expiredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WebhookEvent {
  id: string
  partnerId: string
  dealId: string
  type: 'deal.created' | 'deal.paid' | 'deal.verified' | 'deal.rejected' | 'deal.refunded' | 'deal.expired'
  payload: Record<string, unknown>
  status: 'pending' | 'delivered' | 'failed'
  deliveredAt: string | null
  retryCount: number
  lastError: string | null
  createdAt: string
}

export interface RazorpayRef {
  dealId: string
  paymentLinkId: string | null
  orderId: string | null
  paymentId: string | null
  payoutId: string | null
  status: 'pending' | 'paid' | 'payout_initiated' | 'payout_completed' | 'failed' | 'refunded'
}

export interface ApiKeyRecord {
  id: string
  partnerId: string
  prefix: string
  hash: string
  label: string
  active: boolean
  lastUsedAt: string | null
  createdAt: string
}

// === Creator Reputation Passport ===

export type CreatorBadge = 'verified' | 'reliable' | 'high_engagement' | 'fast_delivery' | 'rising_star'

export interface CreatorProfile {
  id: string
  upiId: string
  displayName: string
  firstSeenPartnerId: string
  firstSeenAt: string
  dealCount: number
  completedDeals: number
  rejectedDeals: number
  totalEarned: number
  totalFees: number
  avgEngagementRate: number
  onTimeRate: number
  badges: CreatorBadge[]
  score: number
  lastActivityAt: string
  updatedAt: string
}

// === Anti-Fraud Network Effect ===

export type FraudType = 'fake_content' | 'non_delivery' | 'suspicious_engagement' | 'identity_mismatch' | 'duplicate_creator' | 'rapid_escalation'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface FraudReport {
  id: string
  partnerId: string
  dealId: string
  creatorUpi: string
  fraudType: FraudType
  description: string
  evidence: string | null
  confirmed: boolean | null
  autoFlagged: boolean
  reportedAt: string
  resolvedAt: string | null
}

export interface FraudSignal {
  creatorUpi: string
  displayName: string
  reportCount: number
  confirmedCount: number
  recentReports: number
  uniquePartnerIds: string[]
  fraudTypes: FraudType[]
  riskLevel: RiskLevel
  firstFlaggedAt: string
  lastFlaggedAt: string
}

export interface DealFraudCheck {
  creatorUpi: string
  riskLevel: RiskLevel
  signalCount: number
  recentReports: number
  fraudTypes: FraudType[]
  flaggedPartnerIds: string[]
  recommendation: 'allow' | 'review' | 'block'
}

export interface FraudReportResponse {
  report: FraudReport
  updatedSignals: FraudSignal
}

// === Regulatory-Ready Ledger ===

export type LedgerEntryType =
  | 'deal_created'
  | 'payment_received'
  | 'fee_collected'
  | 'payout_initiated'
  | 'payout_completed'
  | 'refund_issued'
  | 'verification_passed'
  | 'verification_failed'

export interface LedgerEntry {
  id: string
  dealId: string
  partnerId: string
  partnerDealId: string
  creatorUpi: string
  entryType: LedgerEntryType
  amount: number
  fee: number | null
  netAmount: number | null
  previousHash: string
  hash: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface LedgerExportRow {
  entry_id: string
  deal_id: string
  partner_deal_id: string
  partner_id: string
  creator_upi: string
  event: LedgerEntryType
  amount: number
  fee: number | null
  net_amount: number | null
  hash: string
  previous_hash: string
  timestamp: string
}

// === White-Label Dashboard ===

export interface PartnerBranding {
  partnerId: string
  companyName: string
  logoUrl: string | null
  primaryColor: string
  faviconUrl: string | null
  domain: string | null
  supportEmail: string | null
  customCss: string | null
  updatedAt: string
}

export interface WhiteLabelDashboardData {
  partner: {
    name: string
    logo_url: string | null
    primary_color: string
    domain: string | null
    support_email: string | null
  }
  stats: {
    total_deals: number
    active_deals: number
    completed_deals: number
    total_volume: number
    total_fees: number
    verified_rate: number
  }
  recent_deals: {
    id: string
    creator_name: string
    creator_upi: string
    amount: number
    state: string
    created_at: string
  }[]
  version: string
}

export interface ReputationQueryResponse {
  upi_id: string
  display_name: string
  score: number
  total_deals: number
  completion_rate: number
  on_time_rate: number
  avg_engagement_rate: number
  total_earned: number
  badges: CreatorBadge[]
  first_seen: string
  last_active: string
}
