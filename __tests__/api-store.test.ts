import { describe, it, expect, beforeEach } from 'vitest'
import {
  createPartner,
  createDeal,
  getDeal,
  getDealByPartnerRef,
  updateDealState,
  getPartnerDeals,
  createWebhook,
  getPendingWebhooks,
  markWebhookDelivered,
  markWebhookFailed,
  storeRazorpayRef,
  getRazorpayRef,
  generateApiKey,
  validateApiKey,
  deletePartnerData,
  seedDemoPartner,
  getOrCreateCreatorProfile,
  updateCreatorReputation,
  getCreatorReputation,
  searchCreatorProfiles,
  getAllCreatorProfiles,
  reportFraud,
  confirmFraud,
  checkFraud,
  getFraudSignals,
  getFraudReports,
  autoFlagRejectedDeal,
  appendLedgerEntry,
  getDealLedger,
  getLedgerEntries,
  verifyLedgerChain,
  getLedgerHashChainSummary,
  setPartnerBranding,
  getPartnerBranding,
  getWhiteLabelDashboard,
  validateAdminKey,
  checkExpiredDeals,
  getWebhookDeliveryStatus,
} from '../lib/api-store'

beforeEach(() => {
  deletePartnerData()
})

describe('API Keys', () => {
  it('generateApiKey returns raw key, prefix, and hash', () => {
    const { raw, prefix, hash } = generateApiKey()
    expect(raw).toMatch(/^sk_live_/)
    expect(raw.length).toBeGreaterThanOrEqual(40)
    expect(prefix).toBe(raw.substring(0, 8))
    expect(hash).toBeTruthy()
  })

  it('validateApiKey returns null for unknown key', () => {
    expect(validateApiKey('sk_live_nonexistent')).toBeNull()
  })

  it('validateApiKey returns partner for valid key', () => {
    const { partner, apiKey } = createPartner('Test Partner', 'https://example.com/webhook')
    const result = validateApiKey(apiKey)
    expect(result).not.toBeNull()
    expect(result!.id).toBe(partner.id)
    expect(result!.name).toBe('Test Partner')
  })

  it('validateApiKey updates lastUsedAt', () => {
    const { apiKey } = createPartner('Test Partner')
    const key = validateApiKey(apiKey)
    expect(key).not.toBeNull()
  })

  it('different partners have different keys', () => {
    const { apiKey: key1 } = createPartner('Partner A')
    const { apiKey: key2 } = createPartner('Partner B')
    expect(key1).not.toBe(key2)
  })
})

describe('Partner Management', () => {
  it('createPartner creates partner and api key', () => {
    const { partner, apiKey } = createPartner('Localyse', 'https://localyse.com/webhook')
    expect(partner.id).toMatch(/^part_/)
    expect(partner.name).toBe('Localyse')
    expect(partner.webhookUrl).toBe('https://localyse.com/webhook')
    expect(partner.sandbox).toBe(false)
    expect(apiKey).toMatch(/^sk_live_/)
  })

  it('createPartner works without webhook URL', () => {
    const { partner } = createPartner('Cirql')
    expect(partner.webhookUrl).toBeNull()
  })

  it('seedDemoPartner creates a demo partner', () => {
    const { partner, apiKey } = seedDemoPartner()
    expect(partner.name).toBe('Demo Localyse')
    expect(apiKey).toMatch(/^sk_live_/)
  })

  it('seedDemoPartner is idempotent', () => {
    const first = seedDemoPartner()
    const second = seedDemoPartner()
    expect(first.partner.id).toBe(second.partner.id)
  })
})

describe('Deal Management', () => {
  it('createDeal creates a deal with pending_payment state', () => {
    const { partner } = createPartner('Test')
    const deal = createDeal({
      partnerId: partner.id,
      partnerDealId: 'deal-001',
      brandPhone: '+919876543210',
      brandName: 'Fofo Ice Cream',
      creatorUpi: 'creator@paytm',
      creatorName: 'Rahul',
      amount: 10000,
      contentType: 'instagram_reel',
    })

    expect(deal.id).toMatch(/^deal_/)
    expect(deal.partnerDealId).toBe('deal-001')
    expect(deal.state).toBe('pending_payment')
    expect(deal.amount).toBe(10000)
    expect(deal.fee).toBe(500)
    expect(deal.netAmount).toBe(9500)
    expect(deal.partnerId).toBe(partner.id)
    expect(deal.paymentLink).toBeNull()
  })

  it('getDeal returns null for unknown id', () => {
    expect(getDeal('nonexistent')).toBeNull()
  })

  it('getDeal returns created deal', () => {
    const { partner } = createPartner('Test')
    const deal = createDeal({
      partnerId: partner.id,
      partnerDealId: 'deal-001',
      brandPhone: '+919876543210',
      brandName: 'Test',
      creatorUpi: 'creator@upi',
      creatorName: 'Creator',
      amount: 5000,
      contentType: 'youtube_short',
    })
    const found = getDeal(deal.id)
    expect(found).not.toBeNull()
    expect(found!.id).toBe(deal.id)
  })

  it('getDealByPartnerRef finds deal by partner reference', () => {
    const { partner } = createPartner('Test')
    createDeal({
      partnerId: partner.id,
      partnerDealId: 'ext-abc',
      brandPhone: '+911234567890',
      brandName: 'Test',
      creatorUpi: 'c@upi',
      creatorName: 'C',
      amount: 2000,
      contentType: 'instagram_reel',
    })
    const found = getDealByPartnerRef(partner.id, 'ext-abc')
    expect(found).not.toBeNull()
    expect(found!.partnerDealId).toBe('ext-abc')
  })

  it('getDealByPartnerRef does not cross partners', () => {
    const { partner: p1 } = createPartner('A')
    const { partner: p2 } = createPartner('B')
    createDeal({
      partnerId: p1.id,
      partnerDealId: 'ref-1',
      brandPhone: '+911',
      brandName: 'A',
      creatorUpi: 'a@upi',
      creatorName: 'A',
      amount: 1000,
      contentType: 'instagram_reel',
    })
    expect(getDealByPartnerRef(p2.id, 'ref-1')).toBeNull()
  })

  it('updateDealState changes deal state', () => {
    const { partner } = createPartner('Test')
    const deal = createDeal({
      partnerId: partner.id,
      partnerDealId: 'd-1',
      brandPhone: '+911',
      brandName: 'T',
      creatorUpi: 'c@upi',
      creatorName: 'C',
      amount: 1000,
      contentType: 'instagram_reel',
    })
    updateDealState(deal.id, 'payment_received')
    const updated = getDeal(deal.id)
    expect(updated!.state).toBe('payment_received')
    expect(updated!.updatedAt).toBeTruthy()
  })

  it('updateDealState returns null for unknown deal', () => {
    expect(updateDealState('nonexistent', 'verified')).toBeNull()
  })

  it('getPartnerDeals returns only deals for a partner', () => {
    const { partner: p1 } = createPartner('P1')
    const { partner: p2 } = createPartner('P2')
    createDeal({ partnerId: p1.id, partnerDealId: 'd1', brandPhone: '+911', brandName: 'A', creatorUpi: 'a@upi', creatorName: 'A', amount: 1000, contentType: 'instagram_reel' })
    createDeal({ partnerId: p1.id, partnerDealId: 'd2', brandPhone: '+912', brandName: 'B', creatorUpi: 'b@upi', creatorName: 'B', amount: 2000, contentType: 'youtube_short' })
    createDeal({ partnerId: p2.id, partnerDealId: 'd3', brandPhone: '+913', brandName: 'C', creatorUpi: 'c@upi', creatorName: 'C', amount: 3000, contentType: 'instagram_reel' })

    const p1Deals = getPartnerDeals(p1.id)
    expect(p1Deals).toHaveLength(2)
    expect(p1Deals.map(d => d.partnerDealId)).toEqual(expect.arrayContaining(['d1', 'd2']))

    const p2Deals = getPartnerDeals(p2.id)
    expect(p2Deals).toHaveLength(1)
  })
})

describe('Webhook Events', () => {
  it('createWebhook creates pending webhook', () => {
    const { partner } = createPartner('Test')
    const { partner: p2 } = createPartner('T2')
    const deal = createDeal({ partnerId: p2.id, partnerDealId: 'd1', brandPhone: '+911', brandName: 'A', creatorUpi: 'a@upi', creatorName: 'A', amount: 1000, contentType: 'instagram_reel' })

    const wh = createWebhook({
      partnerId: partner.id,
      dealId: deal.id,
      type: 'deal.created',
      payload: { deal_id: deal.id },
    })
    expect(wh.id).toMatch(/^wh_/)
    expect(wh.status).toBe('pending')
    expect(wh.retryCount).toBe(0)
    expect(wh.deliveredAt).toBeNull()
  })

  it('getPendingWebhooks returns only pending webhooks', () => {
    const { partner } = createPartner('Test')
    const { partner: p2 } = createPartner('T2')
    const deal = createDeal({ partnerId: p2.id, partnerDealId: 'd1', brandPhone: '+911', brandName: 'A', creatorUpi: 'a@upi', creatorName: 'A', amount: 1000, contentType: 'instagram_reel' })

    const wh1 = createWebhook({ partnerId: partner.id, dealId: deal.id, type: 'deal.created', payload: {} })
    const wh2 = createWebhook({ partnerId: partner.id, dealId: deal.id, type: 'deal.verified', payload: {} })
    markWebhookDelivered(wh1.id)

    const pending = getPendingWebhooks()
    expect(pending).toHaveLength(1)
    expect(pending[0].id).toBe(wh2.id)
  })

  it('markWebhookFailed increments retryCount', () => {
    const { partner } = createPartner('Test')
    const { partner: p2 } = createPartner('T2')
    const deal = createDeal({ partnerId: p2.id, partnerDealId: 'd1', brandPhone: '+911', brandName: 'A', creatorUpi: 'a@upi', creatorName: 'A', amount: 1000, contentType: 'instagram_reel' })

    const wh = createWebhook({ partnerId: partner.id, dealId: deal.id, type: 'deal.created', payload: {} })
    markWebhookFailed(wh.id, 'Timeout')
    expect(getPendingWebhooks()).toHaveLength(1)

    const updated = getPendingWebhooks()[0]
    expect(updated.retryCount).toBe(1)
    expect(updated.lastError).toBe('Timeout')
  })

  it('markWebhookFailed marks as failed after 5 retries', () => {
    const { partner } = createPartner('Test')
    const { partner: p2 } = createPartner('T2')
    const deal = createDeal({ partnerId: p2.id, partnerDealId: 'd1', brandPhone: '+911', brandName: 'A', creatorUpi: 'a@upi', creatorName: 'A', amount: 1000, contentType: 'instagram_reel' })

    const wh = createWebhook({ partnerId: partner.id, dealId: deal.id, type: 'deal.created', payload: {} })
    for (let i = 0; i < 5; i++) {
      markWebhookFailed(wh.id, `Attempt ${i + 1}`)
    }
    expect(getPendingWebhooks()).toHaveLength(0)
  })
})

describe('Razorpay References', () => {
  it('storeRazorpayRef creates and retrieves a ref', () => {
    storeRazorpayRef({
      dealId: 'deal_test',
      paymentLinkId: 'plink_test',
      orderId: null,
      paymentId: null,
      payoutId: null,
      status: 'pending',
    })
    const ref = getRazorpayRef('deal_test')
    expect(ref).not.toBeNull()
    expect(ref!.paymentLinkId).toBe('plink_test')
    expect(ref!.status).toBe('pending')
  })

  it('storeRazorpayRef updates existing ref', () => {
    storeRazorpayRef({ dealId: 'deal_1', paymentLinkId: 'plink_1', orderId: null, paymentId: null, payoutId: null, status: 'pending' })
    storeRazorpayRef({ dealId: 'deal_1', paymentLinkId: 'plink_1', orderId: null, paymentId: 'pay_1', payoutId: null, status: 'paid' })
    const ref = getRazorpayRef('deal_1')
    expect(ref!.status).toBe('paid')
    expect(ref!.paymentId).toBe('pay_1')
  })

  it('getRazorpayRef returns null for unknown deal', () => {
    expect(getRazorpayRef('nonexistent')).toBeNull()
  })
})

describe('State Machine Transitions', () => {
  it('deal follows expected lifecycle', () => {
    const { partner } = createPartner('Test')
    const deal = createDeal({
      partnerId: partner.id,
      partnerDealId: 'lifecycle-test',
      brandPhone: '+919876543210',
      brandName: 'Lifecycle Brand',
      creatorUpi: 'creator@upi',
      creatorName: 'Creator',
      amount: 10000,
      contentType: 'instagram_reel',
    })

    expect(deal.state).toBe('pending_payment')
    updateDealState(deal.id, 'payment_received')
    expect(getDeal(deal.id)!.state).toBe('payment_received')
    updateDealState(deal.id, 'verified')
    expect(getDeal(deal.id)!.state).toBe('verified')
    updateDealState(deal.id, 'refunded')
    expect(getDeal(deal.id)!.state).toBe('refunded')
  })

  it('deal can transition to expired', () => {
    const { partner } = createPartner('Test')
    const deal = createDeal({
      partnerId: partner.id,
      partnerDealId: 'exp-test',
      brandPhone: '+911',
      brandName: 'X',
      creatorUpi: 'c@upi',
      creatorName: 'C',
      amount: 5000,
      contentType: 'instagram_reel',
    })
    updateDealState(deal.id, 'expired', { expiredAt: new Date().toISOString() })
    const updated = getDeal(deal.id)
    expect(updated!.state).toBe('expired')
    expect(updated!.expiredAt).toBeTruthy()
  })
})

describe('Creator Reputation Passport', () => {
  it('getOrCreateCreatorProfile creates profile for unknown UPI', () => {
    const profile = getOrCreateCreatorProfile('creator@paytm', 'Rahul', 'part_1')
    expect(profile.upiId).toBe('creator@paytm')
    expect(profile.displayName).toBe('Rahul')
    expect(profile.dealCount).toBe(0)
    expect(profile.score).toBe(0)
    expect(profile.firstSeenPartnerId).toBe('part_1')
    expect(profile.firstSeenAt).toBeTruthy()
  })

  it('getOrCreateCreatorProfile returns existing profile', () => {
    const p1 = getOrCreateCreatorProfile('existing@upi')
    const p2 = getOrCreateCreatorProfile('existing@upi')
    expect(p1.id).toBe(p2.id)
  })

  it('updateCreatorReputation updates stats for completed deal', () => {
    getOrCreateCreatorProfile('creator@upi', 'Test Creator')
    const updated = updateCreatorReputation('creator@upi', {
      completed: true,
      amount: 5000,
      fee: 250,
      engagementRate: 3.5,
      onTime: true,
    })

    expect(updated).not.toBeNull()
    expect(updated!.dealCount).toBe(1)
    expect(updated!.completedDeals).toBe(1)
    expect(updated!.totalEarned).toBe(5000)
    expect(updated!.totalFees).toBe(250)
    expect(updated!.avgEngagementRate).toBe(3.5)
    expect(updated!.onTimeRate).toBe(1)
  })

  it('updateCreatorReputation updates stats for rejected deal', () => {
    getOrCreateCreatorProfile('creator2@upi', 'Rejected Creator')
    const updated = updateCreatorReputation('creator2@upi', {
      completed: false,
      amount: 0,
      fee: 0,
    })

    expect(updated!.dealCount).toBe(1)
    expect(updated!.completedDeals).toBe(0)
    expect(updated!.rejectedDeals).toBe(1)
    expect(updated!.totalEarned).toBe(0)
  })

  it('updateCreatorReputation returns null for unknown creator', () => {
    expect(updateCreatorReputation('unknown@upi', { completed: true, amount: 1000, fee: 50 })).toBeNull()
  })

  it('getCreatorReputation returns null for unknown creator', () => {
    expect(getCreatorReputation('nonexistent@upi')).toBeNull()
  })

  it('getCreatorReputation returns profile after creation', () => {
    getOrCreateCreatorProfile('known@upi', 'Known')
    expect(getCreatorReputation('known@upi')).not.toBeNull()
  })

  it('score calculation reflects deal history', () => {
    getOrCreateCreatorProfile('scorer@upi', 'Scorer')

    updateCreatorReputation('scorer@upi', { completed: true, amount: 10000, fee: 500, engagementRate: 4.5, onTime: true })
    let profile = getCreatorReputation('scorer@upi')
    expect(profile!.dealCount).toBe(1)
    expect(profile!.score).toBeGreaterThan(0)

    updateCreatorReputation('scorer@upi', { completed: true, amount: 20000, fee: 1000, engagementRate: 5.0, onTime: true })
    profile = getCreatorReputation('scorer@upi')
    expect(profile!.dealCount).toBe(2)
    expect(profile!.score).toBeGreaterThan(20)
    expect(profile!.badges).toContain('verified')
  })

  it('badges are awarded based on performance', () => {
    getOrCreateCreatorProfile('badger@upi', 'Badger')

    for (let i = 0; i < 10; i++) {
      updateCreatorReputation('badger@upi', { completed: true, amount: 5000, fee: 250, engagementRate: 4.5, onTime: true })
    }

    const profile = getCreatorReputation('badger@upi')
    expect(profile!.badges).toContain('verified')
    expect(profile!.badges).toContain('reliable')
    expect(profile!.badges).toContain('high_engagement')
    expect(profile!.badges).toContain('fast_delivery')
    expect(profile!.badges).toContain('rising_star')
    expect(profile!.score).toBeGreaterThanOrEqual(80)
  })

  it('searchCreatorProfiles finds by UPI prefix', () => {
    getOrCreateCreatorProfile('rahul@paytm', 'Rahul')
    getOrCreateCreatorProfile('priya@upi', 'Priya')

    const results = searchCreatorProfiles('rahul')
    expect(results).toHaveLength(1)
    expect(results[0].upiId).toBe('rahul@paytm')
  })

  it('searchCreatorProfiles finds by display name', () => {
    getOrCreateCreatorProfile('a@upi', 'Alice')
    getOrCreateCreatorProfile('b@upi', 'Bob')

    expect(searchCreatorProfiles('alice')).toHaveLength(1)
    expect(searchCreatorProfiles('bob')).toHaveLength(1)
  })

  it('searchCreatorProfiles returns empty for no match', () => {
    getOrCreateCreatorProfile('known@upi', 'Known')
    expect(searchCreatorProfiles('zzzz')).toHaveLength(0)
  })

  it('getAllCreatorProfiles returns all profiles', () => {
    getOrCreateCreatorProfile('c1@upi', 'C1')
    getOrCreateCreatorProfile('c2@upi', 'C2')
    getOrCreateCreatorProfile('c3@upi', 'C3')

    expect(getAllCreatorProfiles()).toHaveLength(3)
  })

  it('deletePartnerData clears creator profiles', () => {
    getOrCreateCreatorProfile('temp@upi', 'Temp')
    deletePartnerData()
    expect(getAllCreatorProfiles()).toHaveLength(0)
  })
})

describe('Anti-Fraud Network Effect', () => {
  it('reportFraud creates a fraud report and updates signals', () => {
    const { partner } = createPartner('TestPartner')
    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'fraud-1', brandPhone: '+911',
      brandName: 'B', creatorUpi: 'fraudster@upi', creatorName: 'Fraudster',
      amount: 5000, contentType: 'instagram_reel',
    })

    const { report, signal } = reportFraud({
      partnerId: partner.id,
      dealId: deal.id,
      creatorUpi: 'fraudster@upi',
      fraudType: 'non_delivery',
      description: 'Creator never posted content',
    })

    expect(report.id).toMatch(/^fraud_/)
    expect(report.fraudType).toBe('non_delivery')
    expect(report.autoFlagged).toBe(false)
    expect(report.confirmed).toBeNull()
    expect(signal.reportCount).toBe(1)
    expect(signal.riskLevel).toBe('medium')
  })

  it('reportFraud supports auto-flagged reports', () => {
    const { partner } = createPartner('P')
    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'auto', brandPhone: '+911',
      brandName: 'B', creatorUpi: 'auto@upi', creatorName: 'Auto',
      amount: 1000, contentType: 'instagram_reel',
    })

    const { report } = reportFraud({
      partnerId: partner.id,
      dealId: deal.id,
      creatorUpi: 'auto@upi',
      fraudType: 'fake_content',
      description: 'Auto-flagged: suspicious engagement',
      autoFlagged: true,
    })

    expect(report.autoFlagged).toBe(true)
  })

  it('checkFraud returns allow for clean creator', () => {
    const result = checkFraud('clean@upi')
    expect(result.riskLevel).toBe('low')
    expect(result.recommendation).toBe('allow')
    expect(result.signalCount).toBe(0)
  })

  it('checkFraud escalates risk with multiple reports', () => {
    const { partner } = createPartner('Reporter')
    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'r1', brandPhone: '+911',
      brandName: 'B', creatorUpi: 'repeat@upi', creatorName: 'Repeat',
      amount: 1000, contentType: 'instagram_reel',
    })

    for (let i = 0; i < 4; i++) {
      reportFraud({
        partnerId: partner.id,
        dealId: deal.id,
        creatorUpi: 'repeat@upi',
        fraudType: 'non_delivery',
        description: `Report ${i + 1}`,
      })
    }

    const result = checkFraud('repeat@upi')
    expect(result.riskLevel).toBe('high')
    expect(result.recommendation).toBe('review')
    expect(result.signalCount).toBe(4)
  })

  it('checkFraud blocks critical risk creators', () => {
    const { partner } = createPartner('B')
    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'c1', brandPhone: '+911',
      brandName: 'B', creatorUpi: 'critical@upi', creatorName: 'C',
      amount: 1000, contentType: 'instagram_reel',
    })

    for (let i = 0; i < 10; i++) {
      reportFraud({
        partnerId: partner.id,
        dealId: deal.id,
        creatorUpi: 'critical@upi',
        fraudType: 'non_delivery',
        description: `Report ${i + 1}`,
      })
    }

    const result = checkFraud('critical@upi')
    expect(result.riskLevel).toBe('critical')
    expect(result.recommendation).toBe('block')
  })

  it('fraud signals are shared across partners (network effect)', () => {
    const { partner: p1 } = createPartner('PartnerA')
    const { partner: p2 } = createPartner('PartnerB')
    const deal1 = createDeal({
      partnerId: p1.id, partnerDealId: 'n1', brandPhone: '+911',
      brandName: 'A', creatorUpi: 'shared@upi', creatorName: 'Shared',
      amount: 1000, contentType: 'instagram_reel',
    })
    const deal2 = createDeal({
      partnerId: p2.id, partnerDealId: 'n2', brandPhone: '+912',
      brandName: 'B', creatorUpi: 'shared@upi', creatorName: 'Shared',
      amount: 2000, contentType: 'youtube_short',
    })

    reportFraud({ partnerId: p1.id, dealId: deal1.id, creatorUpi: 'shared@upi', fraudType: 'non_delivery', description: 'P1 report' })
    reportFraud({ partnerId: p2.id, dealId: deal2.id, creatorUpi: 'shared@upi', fraudType: 'fake_content', description: 'P2 report' })

    const result = checkFraud('shared@upi')
    expect(result.riskLevel).toBe('high')
    expect(result.signalCount).toBe(2)
    expect(result.flaggedPartnerIds).toHaveLength(2)
    expect(result.fraudTypes).toContain('non_delivery')
    expect(result.fraudTypes).toContain('fake_content')
  })

  it('confirmFraud confirms a report and resolves it', () => {
    const { partner } = createPartner('P')
    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'cf1', brandPhone: '+911',
      brandName: 'B', creatorUpi: 'confirm@upi', creatorName: 'Confirm',
      amount: 1000, contentType: 'instagram_reel',
    })

    const { report } = reportFraud({
      partnerId: partner.id,
      dealId: deal.id,
      creatorUpi: 'confirm@upi',
      fraudType: 'identity_mismatch',
      description: 'Suspicious identity',
    })

    const updated = confirmFraud(report.id, true)
    expect(updated).not.toBeNull()
    expect(updated!.confirmed).toBe(true)
    expect(updated!.resolvedAt).toBeTruthy()
  })

  it('confirmFraud returns null for unknown report', () => {
    expect(confirmFraud('nonexistent', true)).toBeNull()
  })

  it('confirmed reports increase risk level', () => {
    const { partner } = createPartner('P')
    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'cr1', brandPhone: '+911',
      brandName: 'B', creatorUpi: 'confirmed@upi', creatorName: 'Confirmed',
      amount: 1000, contentType: 'instagram_reel',
    })

    const reports: string[] = []
    for (let i = 0; i < 5; i++) {
      const { report } = reportFraud({
        partnerId: partner.id,
        dealId: deal.id,
        creatorUpi: 'confirmed@upi',
        fraudType: 'non_delivery',
        description: `Report ${i + 1}`,
      })
      reports.push(report.id)
    }

    reports.forEach(id => confirmFraud(id, true))

    const result = checkFraud('confirmed@upi')
    expect(result.riskLevel).toBe('critical')
    expect(result.recommendation).toBe('block')
  })

  it('getFraudSignals returns aggregated signals', () => {
    const { partner } = createPartner('P')
    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'gs1', brandPhone: '+911',
      brandName: 'B', creatorUpi: 'signal@upi', creatorName: 'Signal',
      amount: 1000, contentType: 'instagram_reel',
    })

    reportFraud({ partnerId: partner.id, dealId: deal.id, creatorUpi: 'signal@upi', fraudType: 'rapid_escalation', description: 'Test' })
    reportFraud({ partnerId: partner.id, dealId: deal.id, creatorUpi: 'signal@upi', fraudType: 'rapid_escalation', description: 'Test' })

    const signals = getFraudSignals()
    expect(signals.length).toBeGreaterThanOrEqual(1)
    const signal = signals.find(s => s.creatorUpi === 'signal@upi')
    expect(signal).toBeDefined()
    expect(signal!.reportCount).toBe(2)
    expect(signal!.fraudTypes).toContain('rapid_escalation')
  })

  it('getFraudReports filters by creator UPI', () => {
    const { partner } = createPartner('P')
    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'fr1', brandPhone: '+911',
      brandName: 'B', creatorUpi: 'filter@upi', creatorName: 'Filter',
      amount: 1000, contentType: 'instagram_reel',
    })

    reportFraud({ partnerId: partner.id, dealId: deal.id, creatorUpi: 'filter@upi', fraudType: 'duplicate_creator', description: 'Duplicate' })

    expect(getFraudReports('filter@upi')).toHaveLength(1)
    expect(getFraudReports('other@upi')).toHaveLength(0)
  })

  it('autoFlagRejectedDeal flags rejected deals', () => {
    const { partner } = createPartner('P')
    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'af1', brandPhone: '+911',
      brandName: 'B', creatorUpi: 'rejected@upi', creatorName: 'Rejected',
      amount: 1000, contentType: 'instagram_reel',
    })
    updateDealState(deal.id, 'rejected')

    autoFlagRejectedDeal(deal)

    const reports = getFraudReports('rejected@upi')
    expect(reports).toHaveLength(1)
    expect(reports[0].autoFlagged).toBe(true)
    expect(reports[0].fraudType).toBe('non_delivery')
  })

  it('deletePartnerData clears fraud reports', () => {
    const { partner } = createPartner('P')
    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'df1', brandPhone: '+911',
      brandName: 'B', creatorUpi: 'del@upi', creatorName: 'Del',
      amount: 1000, contentType: 'instagram_reel',
    })
    reportFraud({ partnerId: partner.id, dealId: deal.id, creatorUpi: 'del@upi', fraudType: 'non_delivery', description: 'Test' })
    deletePartnerData()
    expect(getFraudReports()).toHaveLength(0)
  })
})

describe('Edge Cases', () => {
  it('deletePartnerData clears all data', () => {
    const { partner } = createPartner('Test')
    createDeal({ partnerId: partner.id, partnerDealId: 'd1', brandPhone: '+911', brandName: 'A', creatorUpi: 'a@upi', creatorName: 'A', amount: 1000, contentType: 'instagram_reel' })
    getOrCreateCreatorProfile('a@upi', 'A')
    appendLedgerEntry({ dealId: 'd1', partnerId: partner.id, partnerDealId: 'pd1', creatorUpi: 'a@upi', entryType: 'deal_created', amount: 1000 })
    deletePartnerData()
    expect(validateApiKey('sk_live_anything')).toBeNull()
    expect(getPartnerDeals('anything')).toHaveLength(0)
    expect(getPendingWebhooks()).toHaveLength(0)
    expect(getAllCreatorProfiles()).toHaveLength(0)
    expect(getFraudReports()).toHaveLength(0)
    expect(getLedgerEntries()).toHaveLength(0)
    expect(getPartnerBranding('anything')).toBeNull()
  })
})

describe('Regulatory-Ready Ledger', () => {
  const partnerData = () => createPartner('LedgerTest', 'https://ledger.webhook.com')
  const dealData = (partnerId: string) => createDeal({
    partnerId, partnerDealId: 'ledger-001', brandPhone: '+919999999999',
    brandName: 'Ledger Brand', creatorUpi: 'ledger@upi', creatorName: 'Ledger Creator',
    amount: 10000, contentType: 'instagram_reel',
  })

  it('appendLedgerEntry creates entry with hash chain', () => {
    const { partner } = partnerData()
    const deal = dealData(partner.id)

    const entry = appendLedgerEntry({
      dealId: deal.id,
      partnerId: partner.id,
      partnerDealId: deal.partnerDealId,
      creatorUpi: deal.creatorUpi,
      entryType: 'deal_created',
      amount: 10000,
      fee: 500,
      netAmount: 9500,
    })

    expect(entry.id).toMatch(/^ledg_/)
    expect(entry.entryType).toBe('deal_created')
    expect(entry.previousHash).toBe('GENESIS')
    expect(entry.hash).toBeTruthy()
    expect(entry.hash).not.toBe('GENESIS')
    expect(entry.amount).toBe(10000)
    expect(entry.fee).toBe(500)
    expect(entry.netAmount).toBe(9500)
  })

  it('subsequent entries chain to previous hash', () => {
    const { partner } = partnerData()
    const deal = dealData(partner.id)

    const e1 = appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'deal_created', amount: 10000 })
    const e2 = appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'payment_received', amount: 10000 })

    expect(e1.previousHash).toBe('GENESIS')
    expect(e2.previousHash).toBe(e1.hash)
    expect(e2.hash).not.toBe(e1.hash)
  })

  it('getDealLedger returns entries for specific deal', () => {
    const { partner } = partnerData()
    const deal1 = dealData(partner.id)
    const deal2 = createDeal({
      partnerId: partner.id, partnerDealId: 'ledger-002', brandPhone: '+918888888888',
      brandName: 'Other', creatorUpi: 'other@upi', creatorName: 'Other',
      amount: 5000, contentType: 'youtube_short',
    })

    appendLedgerEntry({ dealId: deal1.id, partnerId: partner.id, partnerDealId: deal1.partnerDealId, creatorUpi: deal1.creatorUpi, entryType: 'deal_created', amount: 10000 })
    appendLedgerEntry({ dealId: deal2.id, partnerId: partner.id, partnerDealId: deal2.partnerDealId, creatorUpi: deal2.creatorUpi, entryType: 'deal_created', amount: 5000 })

    expect(getDealLedger(deal1.id)).toHaveLength(1)
    expect(getDealLedger(deal2.id)).toHaveLength(1)
  })

  it('getLedgerEntries filters by partner', () => {
    const { partner: p1 } = createPartner('P1')
    const { partner: p2 } = createPartner('P2')
    const d1 = createDeal({ partnerId: p1.id, partnerDealId: 'ld1', brandPhone: '+911', brandName: 'A', creatorUpi: 'a@upi', creatorName: 'A', amount: 1000, contentType: 'instagram_reel' })
    const d2 = createDeal({ partnerId: p2.id, partnerDealId: 'ld2', brandPhone: '+912', brandName: 'B', creatorUpi: 'b@upi', creatorName: 'B', amount: 2000, contentType: 'youtube_short' })

    appendLedgerEntry({ dealId: d1.id, partnerId: p1.id, partnerDealId: d1.partnerDealId, creatorUpi: d1.creatorUpi, entryType: 'deal_created', amount: 1000 })
    appendLedgerEntry({ dealId: d2.id, partnerId: p2.id, partnerDealId: d2.partnerDealId, creatorUpi: d2.creatorUpi, entryType: 'deal_created', amount: 2000 })

    const p1Entries = getLedgerEntries({ partnerId: p1.id })
    expect(p1Entries).toHaveLength(1)
    expect(p1Entries[0].amount).toBe(1000)
  })

  it('getLedgerEntries filters by entry type', () => {
    const { partner } = partnerData()
    const deal = dealData(partner.id)

    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'deal_created', amount: 10000 })
    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'payment_received', amount: 10000 })

    expect(getLedgerEntries({ entryType: 'deal_created' })).toHaveLength(1)
    expect(getLedgerEntries({ entryType: 'payment_received' })).toHaveLength(1)
  })

  it('verifyLedgerChain returns valid for correct chain', () => {
    const { partner } = partnerData()
    const deal = dealData(partner.id)

    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'deal_created', amount: 10000 })
    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'payment_received', amount: 10000 })

    const result = verifyLedgerChain()
    expect(result.valid).toBe(true)
    expect(result.entriesChecked).toBe(2)
  })

  it('verifyLedgerChain detects tampered hash', () => {
    const { partner } = partnerData()
    const deal = dealData(partner.id)

    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'deal_created', amount: 10000 })
    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'payment_received', amount: 10000 })

    const ledger = getLedgerEntries()
    ledger[0].hash = 'TAMPERE D_HASH'
    ledger[0].amount = 99999

    const result = verifyLedgerChain()
    expect(result.valid).toBe(false)
    expect(result.firstBreakIndex).toBe(0)
  })

  it('verifyLedgerChain detects broken chain link', () => {
    const { partner } = partnerData()
    const deal = dealData(partner.id)

    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'deal_created', amount: 10000 })
    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'payment_received', amount: 10000 })

    const ledger = getLedgerEntries()
    ledger[1].previousHash = 'BROKEN_LINK'

    const result = verifyLedgerChain()
    expect(result.valid).toBe(false)
    expect(result.firstBreakIndex).toBe(1)
  })

  it('getLedgerHashChainSummary returns summary for non-empty ledger', () => {
    const { partner } = partnerData()
    const deal = dealData(partner.id)

    const e1 = appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'deal_created', amount: 10000 })

    const summary = getLedgerHashChainSummary()
    expect(summary.totalEntries).toBe(1)
    expect(summary.firstHash).toBe(e1.hash)
    expect(summary.lastHash).toBe(e1.hash)
    expect(summary.createdAt).toBeTruthy()
  })

  it('getLedgerHashChainSummary handles empty ledger', () => {
    deletePartnerData()
    const summary = getLedgerHashChainSummary()
    expect(summary.totalEntries).toBe(0)
    expect(summary.firstHash).toBe('GENESIS')
    expect(summary.lastHash).toBe('GENESIS')
  })

  it('ledger records all deal lifecycle events', () => {
    const { partner } = partnerData()
    const deal = dealData(partner.id)

    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'deal_created', amount: 10000, fee: 500, netAmount: 9500 })
    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'payment_received', amount: 10000 })
    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'fee_collected', amount: 500 })
    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'payout_initiated', amount: 9500 })
    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'payout_completed', amount: 9500 })

    const dealLedger = getDealLedger(deal.id)
    expect(dealLedger).toHaveLength(5)

    const chain = verifyLedgerChain()
    expect(chain.valid).toBe(true)
    expect(chain.entriesChecked).toBe(5)
  })

  it('deletePartnerData clears ledger', () => {
    const { partner } = partnerData()
    const deal = dealData(partner.id)
    appendLedgerEntry({ dealId: deal.id, partnerId: partner.id, partnerDealId: deal.partnerDealId, creatorUpi: deal.creatorUpi, entryType: 'deal_created', amount: 10000 })
    deletePartnerData()
    expect(getLedgerEntries()).toHaveLength(0)
  })
})

describe('White-Label Dashboard', () => {
  it('setPartnerBranding creates branding config', () => {
    const { partner } = createPartner('TestPartner', 'https://test.webhook.com')

    const branding = setPartnerBranding(partner.id, {
      companyName: 'TestPartner Inc.',
      logoUrl: 'https://test.com/logo.png',
      primaryColor: '#ff6600',
      domain: 'dashboard.testpartner.com',
      supportEmail: 'support@testpartner.com',
    })

    expect(branding.companyName).toBe('TestPartner Inc.')
    expect(branding.logoUrl).toBe('https://test.com/logo.png')
    expect(branding.primaryColor).toBe('#ff6600')
    expect(branding.domain).toBe('dashboard.testpartner.com')
    expect(branding.supportEmail).toBe('support@testpartner.com')
    expect(branding.updatedAt).toBeTruthy()
  })

  it('getPartnerBranding returns null for unconfigured partner', () => {
    const { partner } = createPartner('Unconfigured')
    expect(getPartnerBranding(partner.id)).toBeNull()
  })

  it('getPartnerBranding returns config after set', () => {
    const { partner } = createPartner('Branded')
    setPartnerBranding(partner.id, { companyName: 'Branded Co.' })
    const branding = getPartnerBranding(partner.id)
    expect(branding).not.toBeNull()
    expect(branding!.companyName).toBe('Branded Co.')
  })

  it('setPartnerBranding updates existing config', () => {
    const { partner } = createPartner('Updatable')
    setPartnerBranding(partner.id, { companyName: 'Old Name', primaryColor: '#000' })
    setPartnerBranding(partner.id, { companyName: 'New Name' })
    const branding = getPartnerBranding(partner.id)
    expect(branding!.companyName).toBe('New Name')
    expect(branding!.primaryColor).toBe('#000')
  })

  it('uses default primary color when not set', () => {
    const { partner } = createPartner('Default')
    setPartnerBranding(partner.id, { companyName: 'Default Co.' })
    const branding = getPartnerBranding(partner.id)
    expect(branding!.primaryColor).toBe('#6366f1')
  })

  it('getWhiteLabelDashboard returns dashboard data with stats', () => {
    const { partner } = createPartner('DashPartner')
    setPartnerBranding(partner.id, { companyName: 'DashPartner Inc.', primaryColor: '#22c55e' })

    createDeal({
      partnerId: partner.id, partnerDealId: 'wl-1', brandPhone: '+911',
      brandName: 'Brand', creatorUpi: 'c1@upi', creatorName: 'Creator 1',
      amount: 10000, contentType: 'instagram_reel',
    })

    const dashboard = getWhiteLabelDashboard(partner.id)
    expect(dashboard).not.toBeNull()
    expect(dashboard!.partner.name).toBe('DashPartner Inc.')
    expect(dashboard!.partner.primary_color).toBe('#22c55e')
    expect(dashboard!.stats.total_deals).toBe(1)
    expect(dashboard!.stats.total_volume).toBe(10000)
    expect(dashboard!.recent_deals).toHaveLength(1)
    expect(dashboard!.version).toBe('1.0.0')
  })

  it('getWhiteLabelDashboard returns null for unknown partner', () => {
    expect(getWhiteLabelDashboard('nonexistent')).toBeNull()
  })

  it('getWhiteLabelDashboard uses partner name when no branding set', () => {
    const { partner } = createPartner('Unbranded Partner')
    createDeal({
      partnerId: partner.id, partnerDealId: 'wl-2', brandPhone: '+912',
      brandName: 'B', creatorUpi: 'c2@upi', creatorName: 'C2',
      amount: 5000, contentType: 'youtube_short',
    })

    const dashboard = getWhiteLabelDashboard(partner.id)
    expect(dashboard!.partner.name).toBe('Unbranded Partner')
    expect(dashboard!.partner.primary_color).toBe('#6366f1')
  })

  it('getWhiteLabelDashboard computes verified rate', () => {
    const { partner } = createPartner('RateTest')
    const d1 = createDeal({
      partnerId: partner.id, partnerDealId: 'rate-1', brandPhone: '+913',
      brandName: 'R', creatorUpi: 'r@upi', creatorName: 'R1',
      amount: 1000, contentType: 'instagram_reel',
    })
    const d2 = createDeal({
      partnerId: partner.id, partnerDealId: 'rate-2', brandPhone: '+914',
      brandName: 'R', creatorUpi: 'r2@upi', creatorName: 'R2',
      amount: 2000, contentType: 'instagram_reel',
    })
    updateDealState(d1.id, 'verified')
    updateDealState(d2.id, 'rejected')

    const dashboard = getWhiteLabelDashboard(partner.id)
    expect(dashboard!.stats.total_deals).toBe(2)
    expect(dashboard!.stats.completed_deals).toBe(1)
    expect(dashboard!.stats.verified_rate).toBe(50)
  })

  it('deletePartnerData clears branding', () => {
    const { partner } = createPartner('Clean')
    setPartnerBranding(partner.id, { companyName: 'Clean Co.' })
    deletePartnerData()
    expect(getPartnerBranding(partner.id)).toBeNull()
  })
})

describe('Admin Operations', () => {
  it('validateAdminKey accepts correct key', () => {
    expect(validateAdminKey('admin_nexus_dev_key_2026')).toBe(true)
  })

  it('validateAdminKey rejects wrong key', () => {
    expect(validateAdminKey('wrong_key')).toBe(false)
    expect(validateAdminKey('')).toBe(false)
  })

  it('checkExpiredDeals refunds old deals in payment_received state', () => {
    const { partner } = createPartner('Test')

    const oldDeal = createDeal({
      partnerId: partner.id, partnerDealId: 'old-1', brandPhone: '+911',
      brandName: 'Old', creatorUpi: 'old@upi', creatorName: 'Old',
      amount: 5000, contentType: 'instagram_reel',
    })

    updateDealState(oldDeal.id, 'payment_received')
    oldDeal.createdAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()

    const result = checkExpiredDeals()
    expect(result.refunded).toBe(1)

    const refunded = getDeal(oldDeal.id)
    expect(refunded!.state).toBe('refunded')
    expect(refunded!.expiredAt).toBeTruthy()
  })

  it('checkExpiredDeals does not refund recent deals', () => {
    const { partner } = createPartner('Test')

    const freshDeal = createDeal({
      partnerId: partner.id, partnerDealId: 'fresh-1', brandPhone: '+911',
      brandName: 'Fresh', creatorUpi: 'fresh@upi', creatorName: 'Fresh',
      amount: 3000, contentType: 'youtube_short',
    })

    updateDealState(freshDeal.id, 'payment_received')

    const result = checkExpiredDeals()
    expect(result.refunded).toBe(0)
  })

  it('checkExpiredDeals creates ledger entry for refund', () => {
    const { partner } = createPartner('TestLedger')
    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'ledger-old', brandPhone: '+911',
      brandName: 'L', creatorUpi: 'l@upi', creatorName: 'L',
      amount: 10000, contentType: 'instagram_reel',
    })
    updateDealState(deal.id, 'payment_received')
    deal.createdAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()

    checkExpiredDeals()
    const ledger = getDealLedger(deal.id)
    expect(ledger.some(e => e.entryType === 'refund_issued')).toBe(true)
  })

  it('getWebhookDeliveryStatus returns correct counts', () => {
    const { partner } = createPartner('WHTest')

    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'wh-status', brandPhone: '+911',
      brandName: 'WH', creatorUpi: 'wh@upi', creatorName: 'WH',
      amount: 1000, contentType: 'instagram_reel',
    })

    const wh1 = createWebhook({ partnerId: partner.id, dealId: deal.id, type: 'deal.created', payload: {} })
    const wh2 = createWebhook({ partnerId: partner.id, dealId: deal.id, type: 'deal.verified', payload: {} })
    const wh3 = createWebhook({ partnerId: partner.id, dealId: deal.id, type: 'deal.rejected', payload: {} })

    markWebhookDelivered(wh1.id)
    for (let i = 0; i < 5; i++) {
      markWebhookFailed(wh3.id, 'Connection refused')
    }

    const status = getWebhookDeliveryStatus()
    expect(status.total).toBe(3)
    expect(status.delivered).toBe(1)
    expect(status.pending).toBe(1)
    expect(status.failed).toBe(1)
    expect(status.retryQueue).toHaveLength(1)
    expect(status.retryQueue[0].id).toBe(wh2.id)
  })

  it('getWebhookDeliveryStatus returns retry queue with correct info', () => {
    const { partner } = createPartner('WHR')
    const deal = createDeal({
      partnerId: partner.id, partnerDealId: 'wh-retry', brandPhone: '+911',
      brandName: 'R', creatorUpi: 'r@upi', creatorName: 'R',
      amount: 1000, contentType: 'instagram_reel',
    })

    const wh = createWebhook({ partnerId: partner.id, dealId: deal.id, type: 'deal.created', payload: { test: true } })
    for (let i = 0; i < 3; i++) {
      markWebhookFailed(wh.id, 'Timeout error')
    }

    const status = getWebhookDeliveryStatus()
    expect(status.retryQueue[0].retryCount).toBe(3)
    expect(status.retryQueue[0].lastError).toBe('Timeout error')
    expect(status.retryQueue[0].type).toBe('deal.created')
  })

  it('getWebhookDeliveryStatus handles empty state', () => {
    const status = getWebhookDeliveryStatus()
    expect(status.total).toBe(0)
    expect(status.delivered).toBe(0)
    expect(status.pending).toBe(0)
    expect(status.failed).toBe(0)
    expect(status.retryQueue).toHaveLength(0)
  })
})
