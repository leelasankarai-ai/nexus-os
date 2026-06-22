import { describe, it, expect, beforeEach } from 'vitest'
import * as data from '../lib/data'

beforeEach(() => {
  data.stopSim()
})

describe('Campaigns', () => {
  it('returns a copy of all campaigns', () => {
    const campaigns = data.getCampaigns()
    expect(Array.isArray(campaigns)).toBe(true)
    campaigns.forEach(c => {
      expect(c).toHaveProperty('id')
      expect(c).toHaveProperty('budget')
      expect(c).toHaveProperty('status')
    })
  })

  it('creates a new campaign with escrow transaction', () => {
    const c = data.createCampaign({
      brandName: 'Test Brand',
      name: 'Test Campaign',
      budget: 500000,
      tier: 'tier1',
    })
    expect(c.id).toMatch(/^cmp-\d+/)
    expect(c.brandName).toBe('Test Brand')
    expect(c.budget).toBe(500000)
    expect(c.escrowBalance).toBe(500000)
    expect(c.status).toBe('escrow_funded')

    const campaigns = data.getCampaigns()
    expect(campaigns.find(x => x.id === c.id)).toBeTruthy()

    const txs = data.getTransactions()
    expect(txs.find(t => t.type === 'deposit' && t.amount === 500000)).toBeTruthy()
  })

  it('applies defaults for optional fields', () => {
    const c = data.createCampaign({
      brandName: 'Defaults Co',
      name: 'Defaults Test',
      budget: 250000,
      tier: 'tier3',
    })
    expect(c.ageMin).toBe(18)
    expect(c.ageMax).toBe(45)
    expect(c.minER).toBe(3.0)
    expect(c.impressions).toBe(0)
    expect(c.activeCreators).toBe(0)
    expect(c.targetNiches).toEqual([])
  })

  it('accepts custom age, niches, and minER', () => {
    const c = data.createCampaign({
      brandName: 'Custom Co',
      name: 'Custom Test',
      budget: 1000000,
      tier: 'tier2',
      ageMin: 25,
      ageMax: 50,
      targetNiches: ['Tech', 'FinTech'],
      minER: 4.5,
    })
    expect(c.ageMin).toBe(25)
    expect(c.ageMax).toBe(50)
    expect(c.targetNiches).toEqual(['Tech', 'FinTech'])
    expect(c.minER).toBe(4.5)
  })

  it('sets region based on tier', () => {
    const regions = data.getTierRegions()
    const t1 = data.createCampaign({ brandName: 'A', name: 'B', budget: 100, tier: 'tier1' })
    expect(regions.tier1).toContain(t1.region)
    const t3 = data.createCampaign({ brandName: 'A', name: 'C', budget: 100, tier: 'tier3' })
    expect(regions.tier3).toContain(t3.region)
  })

  it('getTierRegions returns tier-to-regions mapping', () => {
    const r = data.getTierRegions()
    expect(r.tier1).toContain('Mumbai')
    expect(r.tier2).toContain('Jaipur')
    expect(r.tier3).toContain('Guwahati')
  })

  it('getNiches returns available niches', () => {
    const n = data.getNiches()
    expect(n).toContain('Tech')
    expect(n).toContain('FinTech')
    expect(n).toContain('Fashion')
  })
})

describe('Deals', () => {
  it('returns a copy of all deals', () => {
    const deals = data.getDeals()
    expect(Array.isArray(deals)).toBe(true)
    deals.forEach(d => {
      expect(d).toHaveProperty('status')
      expect(d).toHaveProperty('payout')
    })
  })

  it('acceptDeal marks deal as accepted', () => {
    const deals = data.getDeals()
    const openDeal = deals.find(d => d.status === 'open')
    if (!openDeal) return

    const result = data.acceptDeal(openDeal.id, 'creator-1')
    expect(result.status).toBe('accepted')
    expect(result.creatorId).toBe('creator-1')

    const updated = data.getDeals().find(d => d.id === openDeal.id)
    expect(updated?.status).toBe('accepted')
  })

  it('acceptDeal throws if deal not found', () => {
    expect(() => data.acceptDeal('nonexistent', 'creator-1')).toThrow('Deal not found')
  })

  it('acceptDeal throws if deal already taken', () => {
    const deals = data.getDeals()
    const taken = deals.find(d => d.status !== 'open')
    if (taken) {
      expect(() => data.acceptDeal(taken.id, 'creator-1')).toThrow('Deal already taken')
    }
  })

  it('acceptDeal throws if deal is not open', () => {
    const result = data.acceptDeal(data.getDeals().find(d => d.status === 'open')!.id, 'creator-2')
    expect(result.status).toBe('accepted')
    expect(() => data.acceptDeal(result.id, 'creator-2')).toThrow('Deal already taken')
  })
})

describe('Submissions', () => {
  it('submitDealContent creates a pending submission', () => {
    const deal = data.acceptDeal(data.getDeals().find(d => d.status === 'open')!.id, 'creator-1')
    const sub = data.submitDealContent(deal.id, 'creator-1', 'https://example.com/test')
    expect(sub.status).toBe('pending')
    expect(sub.url).toBe('https://example.com/test')
    expect(sub.payout).toBe(deal.payout)
    expect(sub.creatorId).toBe('creator-1')

    const subs = data.getSubmissions()
    expect(subs.find(s => s.id === sub.id)).toBeTruthy()
  })

  it('submitDealContent throws if deal not found', () => {
    expect(() => data.submitDealContent('invalid-id', 'creator-1', 'https://x.com')).toThrow('Deal not found')
  })

  it('submitDealContent throws if deal not accepted', () => {
    const openDeal = data.getDeals().find(d => d.status === 'open')
    if (openDeal) {
      expect(() => data.submitDealContent(openDeal.id, 'creator-1', 'https://x.com')).toThrow('Must accept deal first')
    }
  })

  it('returns a copy of all submissions', () => {
    const subs = data.getSubmissions()
    expect(Array.isArray(subs)).toBe(true)
    subs.forEach(s => {
      expect(s).toHaveProperty('erResult')
      expect(s).toHaveProperty('geoResult')
      expect(s).toHaveProperty('botResult')
    })
  })
})

describe('Verification', () => {
  it('verifySubmission updates creator wallet and campaign escrow', () => {
    const allSubs = data.getSubmissions()
    const pending = data.getSubmissions().find(s => s.status === 'pending')
    if (!pending) return

    const creator = data.getCreator(pending.creatorId)!
    const beforeWallet = creator.wallet
    const beforeEarned = creator.totalEarned
    const beforeDeals = creator.completedDeals

    const verified = data.verifySubmission(pending.id)
    expect(verified.status).toBe('verified')
    expect(verified.verifiedAt).toBeTruthy()

    const updatedCreator = data.getCreator(pending.creatorId)!
    expect(updatedCreator.wallet).toBe(beforeWallet + pending.payout)
    expect(updatedCreator.totalEarned).toBe(beforeEarned + pending.payout)
    expect(updatedCreator.completedDeals).toBe(beforeDeals + 1)

    const txs = data.getTransactions()
    expect(txs.find(t => t.type === 'payout' && t.amount === pending.payout)).toBeTruthy()
  })

  it('verifySubmission updates deal status to paid', () => {
    const sub = data.getSubmissions().find(s => s.status === 'pending')
    if (!sub) return

    data.verifySubmission(sub.id)
    const updatedDeal = data.getDeals().find(d => d.id === sub.dealId)
    expect(updatedDeal?.status).toBe('paid')
  })

  it('verifySubmission throws if submission not found', () => {
    expect(() => data.verifySubmission('invalid-id')).toThrow('Submission not found')
  })
})

describe('Creators', () => {
  it('getCreators returns all creators', () => {
    const creators = data.getCreators()
    expect(Array.isArray(creators)).toBe(true)
    creators.forEach(c => {
      expect(c).toHaveProperty('wallet')
      expect(c).toHaveProperty('completedDeals')
    })
  })

  it('getCreator returns a single creator by id', () => {
    const c = data.getCreator('creator-1')
    expect(c).not.toBeNull()
    expect(c!.name).toBe('Priya Sharma')
    expect(c!.wallet).toBeGreaterThanOrEqual(0)
  })

  it('getCreator returns null for unknown id', () => {
    expect(data.getCreator('nonexistent')).toBeNull()
  })
})

describe('Wallet', () => {
  it('getWallet returns current balance', () => {
    const w = data.getWallet()
    expect(typeof w).toBe('number')
  })

  it('withdrawAll zeros wallet and records transaction', () => {
    const before = data.getWallet()
    const amount = data.withdrawAll()
    expect(amount).toBe(before)
    expect(data.getWallet()).toBe(0)

    const txs = data.getTransactions()
    expect(txs.find(t => t.type === 'withdrawal' && t.amount === before)).toBeTruthy()
  })
})

describe('Notifications', () => {
  it('returns copy of notifications', () => {
    const notifs = data.getNotifications()
    expect(Array.isArray(notifs)).toBe(true)
    notifs.forEach(n => {
      expect(n).toHaveProperty('message')
      expect(n).toHaveProperty('type')
      expect(n).toHaveProperty('read')
    })
  })
})

describe('Transactions', () => {
  it('returns copy of transactions', () => {
    const txs = data.getTransactions()
    expect(Array.isArray(txs)).toBe(true)
    txs.forEach(t => {
      expect(t).toHaveProperty('type')
      expect(t).toHaveProperty('amount')
      expect(t).toHaveProperty('from')
      expect(t).toHaveProperty('to')
    })
  })
})

describe('Metrics', () => {
  it('aggregates campaign metrics', () => {
    const m = data.getMetrics()
    expect(m).toHaveProperty('totalImpressions')
    expect(m).toHaveProperty('totalCreators')
    expect(m).toHaveProperty('totalEscrow')
    expect(m).toHaveProperty('activeCampaigns')
    expect(m).toHaveProperty('totalBudget')
    expect(typeof m.totalImpressions).toBe('number')
    expect(typeof m.totalBudget).toBe('number')
    expect(m.activeCampaigns).toBeGreaterThan(0)
  })

  it('excludes completed campaigns from activeCampaigns', () => {
    const m = data.getMetrics()
    const campaigns = data.getCampaigns()
    const expectedActive = campaigns.filter(c => c.status !== 'campaign_completed').length
    expect(m.activeCampaigns).toBe(expectedActive)
  })
})

describe('Reputation & Badges', () => {
  it('getBadgeDefs returns all badge definitions', () => {
    const defs = data.getBadgeDefs()
    expect(defs.length).toBeGreaterThanOrEqual(8)
    expect(defs.find(d => d.id === 'badge-first')).toBeTruthy()
    expect(defs.find(d => d.id === 'badge-10deals')).toBeTruthy()
  })

  it('getBadges returns creator badges', () => {
    const badges = data.getBadges('creator-1')
    expect(badges.length).toBeGreaterThan(0)
    badges.forEach(b => {
      expect(b).toHaveProperty('id')
      expect(b).toHaveProperty('unlockedAt')
    })
  })

  it('getBadges returns empty for unknown creator', () => {
    expect(data.getBadges('nonexistent')).toEqual([])
  })

  it('computeReputation returns a score 0-100', () => {
    const score = data.computeReputation('creator-1')
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('computeReputation returns 0 for unknown creator', () => {
    expect(data.computeReputation('nonexistent')).toBe(0)
  })

  it('checkBadges awards new badges when conditions met', () => {
    const creator = data.getCreator('creator-1')!
    const beforeCount = creator.badges.length
    const newBadges = data.checkBadges('creator-1')
    expect(newBadges.length).toBe(0)
    expect(creator.badges.length).toBe(beforeCount)
  })

  it('verifySubmission triggers badge check and reputation update', () => {
    const deal = data.acceptDeal(data.getDeals().find(d => d.status === 'open')!.id, 'creator-1')
    const sub = data.submitDealContent(deal.id, 'creator-1', 'https://example.com/test')

    data.verifySubmission(sub.id)
    const creatorAfter = data.getCreator('creator-1')!
    expect(creatorAfter.reputationScore).toBeGreaterThanOrEqual(0)
    expect(creatorAfter.reputationScore).toBeLessThanOrEqual(100)
  })
})

describe('Simulation', () => {
  it('startSim and stopSim are idempotent', () => {
    data.startSim()
    data.startSim()
    data.stopSim()
    data.stopSim()
  })

  it('subscribe returns an unsubscribe function', () => {
    const unsub = data.subscribe(() => {})
    expect(typeof unsub).toBe('function')
    unsub()
  })

  it('subscribe callback is called on simulation tick', async () => {
    ;(globalThis as any).window = globalThis
    const impressionsBefore = data.getCampaigns().find(c => c.status !== 'campaign_completed')?.impressions ?? 0

    await new Promise<void>((resolve) => {
      let called = false
      data.subscribe(() => {
        if (!called) {
          called = true
          resolve()
        }
      })
      data.startSim()
    })

    const impressionsAfter = data.getCampaigns().find(c => c.status !== 'campaign_completed')?.impressions ?? 0
    expect(impressionsAfter).toBeGreaterThanOrEqual(impressionsBefore)

    data.stopSim()
    delete (globalThis as any).window
  }, 8000)
})
