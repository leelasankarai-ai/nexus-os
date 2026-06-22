# CEO Scope Expansions — API-First Escrow & Verification Engine

Generated: 2026-06-22
Mode: SCOPE EXPANSION
Base: APPROVED design doc + REBUILD-PLAN.md

---

## 1. Creator Reputation Passport

**Effort:** ~1 week | **Defensibility:** High — creates portable identity across partner platforms

### Problem
A creator who verifies on Partner A (Localyse) has to re-verify on Partner B (Cirql). Bad actors get kicked off one platform and reappear on another. Each partner's fraud detection starts from zero.

### Solution
Every creator who completes a deal through Nexus builds a portable reputation score. Partner platforms query this before assigning deals. The score is:
- Deal completion rate (% of accepted deals delivered)
- On-time delivery rate (submitted before deadline)
- Engagement ratio (actual vs promised ER)
- Cumulative volume (total ₹ earned through Nexus)
- Bad actor flags (flagged submissions, rejected content)

### API additions
```
GET /v1/creators/:id/reputation
  → { score, dealCount, completionRate, onTimeRate, avgER, totalVolume, badges }

POST /v1/creators/:upi/reference
  → Creates or returns a creator profile keyed by UPI ID
```

### Data model additions
```typescript
CreatorReputation {
  id: string
  upiId: string          // unique identifier across partners
  displayName: string
  firstSeenPartnerId: string
  dealCount: number
  completedDeals: number
  flaggedDeals: number
  totalEarned: number
  avgEngagementRate: number
  badges: string[]       // ['reliable', 'high_engagement', 'verified']
  score: number          // 0-100 computed score
  updatedAt: string
}
```

### Integration
Partners call `GET /v1/creators/reputation?upi=creator@upi` before assigning a deal. If score < 30, the partner can require escrow or reject. If score > 80, reduced fees or faster settlement.

### Monetization
- Standard tier: reputation query included per-transaction
- Premium tier: reputation watchlist (webhook when creator score drops), batch queries

---

## 2. Anti-Fraud Network Effect

**Effort:** ~2 weeks | **Defensibility:** Very High — compounds with every deal, impossible to replicate without volume

### Problem
Phase 2's screenshot comparison is per-deal. A creator can upload the same screenshot to two brands, or inflate engagement on one deal and use those numbers for the next. Each deal is an island.

### Solution
Cross-deal fraud detection that learns from every transaction. Four detection layers:

### Layer 1: Content URL de-duplication
Check if a submitted URL has been submitted before (to any deal, any partner). If yes, flag: content recycling.

### Layer 2: Screenshot hash comparison
Hash the submitted screenshot. Compare against all prior screenshot hashes. Match = content recycling, even with a different URL.

### Layer 3: Engagement pattern analysis
Track per-creator engagement across deals. If ER suddenly drops 50% or spikes 200%, flag. If a creator's engagement numbers are suspiciously round (always exactly 4.5% ER), flag.

### Layer 4: Cross-creator collusion
If two creators submit content for the same brand with matching engagement patterns, flag potential collusion.

### API additions
```
POST /v1/fraud/check
  → { deal_id, content_url, screenshot_hash }
  → { risk_level: 'low'|'medium'|'high', flags: string[], score: number }
```

### Data model additions
```typescript
FraudCheck {
  id: string
  dealId: string
  creatorUpi: string
  contentUrl: string
  screenshotHash: string | null
  riskScore: number         // 0-100
  flags: FraudFlag[]
  checkedAt: string
}

FraudFlag {
  type: 'recycled_url' | 'recycled_screenshot' | 'engagement_anomaly' | 'collusion_signal'
  severity: 'info' | 'warning' | 'critical'
  detail: string           // human-readable explanation
  relatedDealId?: string
}
```

### Integration
Fraud check runs automatically during `POST /v1/verify`. High-risk deals are escalated to manual admin review. Partners see the fraud flags in webhook payloads.

---

## 3. Instant Settlement via Credit Pool

**Effort:** ~3 weeks + regulatory check | **Defensibility:** Medium — creates a liquidity moat

### Problem
Best-case settlement is 60 seconds (UPI) to 2 minutes (IMPS). "Fast" is great. "Instant" is magical. Creators who need money now will prefer a platform that pays in 5 seconds over one that pays in 60.

### Solution
Pre-fund a credit pool. When a deal is verified, pay the creator from the pool immediately (5 seconds). Settle with Razorpay in the background (T+0 or T+1). The float is funded by:
1. Initial capital injection (₹1L minimum to start)
2. Platform fee accumulation (5% per deal)
3. Brand deposits that haven't been paid out yet

### Architecture
```
Brand pays via payment link → funds land in Nexus-controlled sub-account
Deal verified → immediate payout from credit pool to creator UPI
Background: Razorpay settlement from sub-account replenishes credit pool
```

### Data model additions
```typescript
CreditPool {
  id: string
  currentBalance: number    // ₹ available for instant settlement
  reservedBalance: number   // ₹ in flight (payout initiated, not yet reconciled)
  totalDeposited: number    // lifetime
  totalPaidOut: number
  lastReconciledAt: string
}

InstantPayout {
  id: string
  dealId: string
  amount: number
  creatorUpi: string
  status: 'initiated' | 'completed' | 'failed'
  settledAt: string | null    // when Razorpay actually completed
  razorpayRef: string | null
}
```

### Risk management
- Float minimum: never let pool balance drop below ₹10,000
- Auto-pause: if balance < 2x daily payout volume, pause instant settlement and fall back to direct Razorpay payout
- Reconciliation: every hour, reconcile pool balance against Razorpay sub-account
- Fraud hold: if a deal is later reversed (fraud discovered post-payout), deduct from creator's future payouts

### Regulatory note
This is NOT lending — it's a float advance against a confirmed payout. Confirm with legal that this doesn't require an NBFC license at the ₹5K-₹50K deal size.

---

## 4. White-Label Partner Dashboard

**Effort:** ~2 weeks | **Defensibility:** Medium — reduces integration friction

### Problem
Partners integrate the API, but then have to build their own UI for brands to track deals, view payment history, and manage campaigns. This is the #1 barrier to integration for smaller partners.

### Solution
Package the existing three-role UI (BrandDashboard, CreatorView, AdminEscrow) as a white-label dashboard. Partners embed via:
1. **IFrame** — drop in `<iframe src="https://api.nexus-os.io/dashboard/partner/{partnerId}">`
2. **Hosted link** — redirect brands to `dashboard.nexus-os.io/partner/{partnerId}/brand`
3. **Custom domain** — serve from a partner subdomain (`dashboard.partner.com/nexus`)

### Implementation
The existing components (BrandDashboard.tsx, CreatorView.tsx, AdminEscrow.tsx) already exist and work. Changes needed:
- Read partner context from API key (not the existing mock auth)
- Add CORS headers for iframe embedding
- Add theme support (partners configure primary color, logo, brand name)
- Add SSO token authentication (partner passes a signed JWT, no separate login)

### API additions
```
GET /dashboard/{partnerId}/brand  → White-labeled brand dashboard
GET /dashboard/{partnerId}/creator → White-labeled creator dashboard
GET /dashboard/{partnerId}/admin   → White-labeled admin dashboard
```

### Monetization
- Included in standard tier for embedded mode
- Premium tier: custom domain + custom theme + analytics

### Pre-existing value
The UI is already 90% built (3,100+ lines across 9 components). This expansion is primarily integration work, not UI work.

---

## 5. Regulatory-Ready Ledger

**Effort:** ~1 week (non-blocking, can run in parallel) | **Defensibility:** High — future-proofs the business

### Problem
Unlicensed escrow works for ₹5K deals. If a deal hits ₹5L and something goes wrong, the legal exposure is real. Without an audit trail, you can't prove what happened. And when you eventually apply for an escrow license, the regulator will ask: "show me your ledger."

### Solution
Add immutable audit logging to every transaction. Design the ledger so it can pass a regulatory audit today, even if you're not licensed yet.

### Implementation
```
Every state transition → append-only audit log entry:
  { actor, action, entity_type, entity_id, before_state, after_state, timestamp, reason }
```

### Data model additions
```typescript
AuditLogEntry {
  id: string
  actorType: 'partner' | 'brand' | 'creator' | 'admin' | 'system'
  actorId: string
  action: 'deal.created' | 'deal.paid' | 'deal.verified' | 'deal.rejected' | 'deal.refunded'
          | 'payout.initiated' | 'payout.completed' | 'payout.failed'
          | 'kyc.updated' | 'fraud.flagged'
  entityType: 'deal' | 'payout' | 'creator' | 'partner'
  entityId: string
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
  reason: string | null
  ipAddress: string | null
  timestamp: string
}
```

### KYC tier tracking
Every deal records the KYC tier of brand and creator at time of creation. This creates a historical record: "at the time of this ₹50K deal, the brand was KYC-verified and the creator was basic-tier."

### Export
```
GET /v1/ledger/export?from=2026-01-01&to=2026-06-22
  → CSV export of all transactions, audit log, and KYC snapshots
```

### Audit endpoints
```
GET /v1/ledger/deal/{dealId}      → Full lifecycle of a deal
GET /v1/ledger/partner/{partnerId} → All activity for a partner
GET /v1/ledger/export              → Regulatory report (CSV)
```

### Future path
When you apply for an escrow license:
- The regulator audits your ledger
- Every transaction has an unbroken chain of custody
- KYC snapshots prove you knew who was transacting
- No data gaps to explain

---

## Updated Priority Matrix

| Priority | Change | Effort | Status |
|----------|--------|--------|--------|
| P0 | Core API (deals, verify, partners, auth) | — | ✅ DONE |
| P1 | Anti-Fraud Network Effect | 2 weeks | ⬜ NEW |
| P1 | Creator Reputation Passport | 1 week | ⬜ NEW |
| P1 | White-Label Dashboard | 2 weeks | ⬜ NEW |
| P1 | Regulatory-Ready Ledger | 1 week | ⬜ NEW (parallel) |
| P2 | Instant Settlement via Credit Pool | 3 weeks | ⬜ NEW (requires legal check) |

## Execution Strategy

**Track A (API product — build in sequence):**
- Week 1: Core API shipped (DONE)
- Week 2: Creator Reputation Passport
- Week 3-4: Anti-Fraud Network Effect
- Week 5-6: White-Label Dashboard

**Track B (foundation — run in parallel):**
- Week 1+: Regulatory-Ready Ledger (non-blocking, parallel)

**Track C (high-risk, depends on legal):**
- Week 4+: Instant Settlement via Credit Pool
