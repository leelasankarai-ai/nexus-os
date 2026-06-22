# Engineering Review — Nexus OS

**Mode:** HOLD SCOPE (make it bulletproof)
**Reviewer stance:** Catch every failure mode. No silent errors. Observability is scope.

---

## 1. Architecture Score

| Dimension | Score (0-10) | What Would Make It A 10 |
|-----------|-------------|------------------------|
| Data Model | 6 | In-memory mock store works for MVP but has zero isolation. Cross-contamination between users is possible. 10 = PostgreSQL with row-level security + write-audit triggers. |
| Error Handling | 3 | Almost no error handling. Null checks are rare. Empty states exist but are fragile. |
| Auth Security | 4 | localStorage JWT is a known antipattern. XSS → full account takeover. |
| Observability | 1 | No logging, no error capture, no monitoring. Silent failures are the default. |
| Test Coverage | 0 | Zero tests. Every refactor is blind. |
| Type Safety | 0 | Plain JS. No TypeScript. Runtime type errors are guaranteed in production. |

## 2. Data Layer Analysis

### 2.1 The Mock Store (`lib/data.js`)

**Current approach:** In-memory module-level object (`MOCK_DATA`) with direct mutation. Subscribers get callbacks on interval.

**Critical issues:**

**Issue 1 — Data is shared across ALL users.**
```
MOCK_DATA.campaigns  ← Every user reads/writes the same array
```
If brand-1 creates a campaign, brand-2 sees it (filter by brandId is client-side only). With multiple tabs or concurrent users, data races are guaranteed.

**Fix:** Add brandId/server-side filtering or virtual per-user store in MVP. For Phase 1, move to API routes.

**Issue 2 — Mutations are silent.**
```
MOCK_DATA.ledger.push({...})  // Who did this? When? What was the old state?
```
No audit trail for mutations. If a bug corrupts data, you can't trace it.

**Fix:** Wrap every mutation in a `withAudit(fn, context)` that logs: action, userId, timestamp, before/after snapshot.

**Issue 3 — Subscriptions leak. The cleanup function (`subscribeMetrics`) returns a removal callback but the interval (setInterval in the module body) runs forever. If components mount/unmount, listeners accumulate but never fully reset (the module-level `metricsListeners` array is shared across the app).**

**Fix:** Add a `cleanup()` function that clears the interval on unmount. Or use a proper event emitter.

### 2.2 Data Flow Fault Map

| Flow | Happy Path | Null Input | Empty Input | Upstream Error |
|------|-----------|------------|-------------|----------------|
| `getCampaigns` | Returns filtered array | filters.brandId undefined → returns all campaigns (may leak data) | Empty array → returns empty array | N/A (in-memory) |
| `createCampaign` | Creates + returns campaign | data.brandId null → campaign created with null owner | Empty name → no validation, creates "null" campaign | N/A |
| `acceptDeal` | Sets status to 'accepted' | dealId not found → silently returns undefined | N/A | N/A |
| `releaseEscrow` | Creates txn + payment, updates status | escrowId not found → returns null (correct) | N/A | campaign null → `campaign.onHold` crashes with TypeError |
| `getMetrics` | Returns numeric aggregation | brandId null → aggregates ALL campaigns (admin OK, but accidental) | Empty campaign list → all zeros (correct) | N/A |

**Fix needed in `releaseEscrow` (line 133-136):** campaign null check exists but only guards `onHold` — the function still returns partial result. Should return null with error context.

### 2.3 Error Path: Pending Payments Never Complete

`payments` have status 'pending' but there is no mechanism to transition them to 'completed'. Creator sees "pending" forever. Add a `resolvePayment(paymentId)` function called by admin or automated after 24hr.

## 3. Auth Security Audit

### 3.1 Vulnerability Table

| Vulnerability | Severity | Location | Fix |
|--------------|----------|----------|-----|
| JWT in localStorage | CRITICAL | `context/AuthContext.js:37` | httpOnly cookie + NextAuth.js |
| Plaintext password comparison | CRITICAL | `context/AuthContext.js:30` | bcrypt hash (even in mock) |
| No token expiry check | HIGH | AuthContext login() | Add 15min TTL, auto-logout on expiry |
| No CSRF protection | HIGH | All state mutations | SameSite=Strict cookie + CSRF token |
| Role sent from client | HIGH | `createCampaign` takes user.role | Server-validate role from session |
| XSS via `user.avatar` | MEDIUM | `pages/index.js:119` user.avatar rendered in JSX (React escapes, but still a pattern risk) | No injectable values in user profile |
| Registration without verification | MEDIUM | `register()` creates account instantly | Email OTP or phone verification step |

### 3.2 localStorage Session Fix (Minimum Viable)

For Phase 0, wrap auth in an encrypted session cookie even without server:
```js
// Instead of:
localStorage.setItem('nexus_user', JSON.stringify(session))
// Use sessionStorage + crypto subtle:
session.sessionToken = await crypto.subtle.encrypt(...)
```

But the **real** fix is Next.js API middleware with httpOnly cookies. Move auth to `pages/api/auth/login.ts` and `pages/api/auth/me.ts`.

## 4. API Route Architecture

Current: All data access is client-side direct import from `lib/data.js`. No API layer.

**Must add before shipping:**

```
pages/api/
  auth/
    login.ts    — POST { email, password } → set httpOnly cookie
    me.ts       — GET → return session from cookie
    logout.ts   — POST → clear cookie
  campaigns/
    index.ts    — GET (list, filter by brandId) / POST (create)
    [id].ts     — GET / PATCH / DELETE
  deals/
    index.ts    — GET (list, filter by location/category) / PATCH (accept)
  escrow/
    ledger.ts   — GET (admin: all, brand: own)
    release.ts  — POST { escrowId }
  payments/
    index.ts    — GET (userId filter)
  notifications/
    index.ts    — GET (userId filter)
```

Each route validates the session, checks role permissions, and returns typed JSON.

## 5. State Machine Gaps

The PLAN.md campaign lifecycle state machine is good. But it's missing 3 states:

```
Current: DRAFT → PENDING → ACTIVE → VERIFICATION → RELEASED/HELD → COMPLETED
Missing:
- UNDER_REVIEW  (content submitted, brand needs to approve)
- DISPUTED      (brand rejected content, escrow frozen)
- REFUNDED      (dispute resolved in brand's favor, escrow returned)
```

Add these to both the state machine diagram and the data model.

## 6. Performance Analysis

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| First Load JS | 91.9 kB | <100 kB | ✅ Within budget |
| Static pages | 3/3 | All static | ✅ Good |
| Campaign list render | O(n) | O(n) | ✅ Fine for 100-1000 campaigns |
| Metrics recalculation | O(n) every 3s | O(1) with aggregates | ⚠️ Fine for MVP. Phase 1: pre-computed metric store. |
| Interval leaks | HIGH | None | ❌ Memory leak risk on multiple tab/page navigations |

**Fix for interval leak in `lib/data.js`:**

The module-level `window.__nexusSimInterval` flag prevents double-initialization. But:
1. If the user navigates away and comes back, the interval keeps running (wasting CPU)
2. If the component unmounts and remounts, subscribers accumulate
3. No cleanup on page unload

**Fix:**
```js
export function startSimulation() { ... }
export function stopSimulation() { clearInterval(window.__nexusSimInterval); window.__nexusSimInterval = null }
```
Call `startSimulation()` in `_app.js` useEffect, `stopSimulation()` on cleanup.

## 7. Data Model — Missing Entities

**Add these tables/objects:**

```js
// KYC/Verification
const KYC_TIERS = { guest: 0, basic: 1, verified: 2, business: 3 }

// Dispute records
{ id, dealId, escrowId, raisedBy, reason, evidence, status: 'open'|'resolved'|'refunded', resolution }

// Creator reputation
{ creatorId, completionRate, avgRating, responseTime, totalVolume, badges: ['fast_payer', 'top_creator'] }

// Campaign deals (junction table between campaigns and creators)
{ id, campaignId, creatorId, dealId, status: 'assigned'|'in_progress'|'submitted'|'approved'|'disputed', submittedUrl, approvedAt }
```

## 8. Test Strategy

**Phase 0 (this build):** Unit tests for every `lib/data.js` function. Use vitest (zero config, fast):

```js
// tests/data.test.js
import { describe, it, expect, beforeEach } from 'vitest'

describe('createCampaign', () => {
  it('creates a campaign with given data', () => { ... })
  it('assigns correct status (pending)', () => { ... })
  it('creates an escrow ledger entry', () => { ... })
  it('defaults deadline to 30 days out', () => { ... })
  it('handles missing optional fields', () => { ... })
})
```

**Cover all functions:** getCampaigns (with filters), getCampaign, createCampaign, getDeals (with filters), acceptDeal, getLedger, releaseEscrow, getPayments, getNotifications, getMetrics.

## 9. .env Configuration

Add `.env.local` with:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PLATFORM_FEE=0.05
NEXT_PUBLIC_WITHDRAWAL_FEE=0.02
```

And a `.env.example` committed to repo.

## 10. Verdict

**Engineering Rating: 4/10** — The UI is well-built but the infrastructure has critical gaps:
1. ❌ No API layer — client talks directly to mutable shared state
2. ❌ No error handling — null checks missing, TypeErrors guaranteed
3. ❌ No tests — every refactor is blind
4. ❌ No type safety — runtime failures in production
5. ❌ No observability — silent failures are the default
6. ⚠️ Auth security — localStorage JWT is unacceptable for any real data

**Minimum for shipping:**
1. API routes (in `pages/api/`) for every data operation
2. TypeScript migration for `lib/data.js`, API routes, AuthContext
3. Vitest for all data functions
4. Encrypted session cookie instead of localStorage
5. Error boundaries + loading states for all views
6. Audit logging for every mutation
