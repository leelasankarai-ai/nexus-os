# Nexus OS — Consolidated Rebuild Plan (Updated 2026-06-22)

## Source: CEO-REVIEW.md + ENG-REVIEW.md + DESIGN-REVIEW.md + DEVEX-REVIEW.md + plan-eng-review + plan-ceo-review

## Pivot: Marketplace → API-First Escrow & Verification Engine
The design doc (APPROVED 2026-06-22) shifted from building a full three-role marketplace
(Approach B) to an API-first escrow + content verification trust layer (Approach C).
Partner platforms integrate via REST API; the existing UI becomes the admin/demo portal.

**Scope expansion (CEO review 2026-06-22):** All 5 expansions approved — see `CEO-EXPANSIONS.md`.

## Completed (Past Sessions)

| Area | What | Files |
|------|------|-------|
| Types | Partner, PartnerDeal, WebhookEvent, RazorpayRef, ApiKeyRecord, DealState | `lib/types.ts` |
| API Store | In-memory store for API entities with full CRUD | `lib/api-store.ts` |
| Razorpay | Payment links, payouts, refunds, webhooks (mock + live) | `lib/razorpay.ts` |
| Webhooks | Delivery system with retry (5x), timeout, dedup | `lib/webhooks.ts` |
| Env | Centralized env config | `lib/env.ts` |
| Auth | API key generation, validation, scoping | `lib/api-store.ts` |
| V1 API | `POST /v1/deal` — create deal + payment link | `pages/api/v1/deals/index.ts` |
| V1 API | `GET /v1/deals` — list partner deals | `pages/api/v1/deals/index.ts` |
| V1 API | `GET /v1/deals/:id` — get single deal | `pages/api/v1/deals/[id].ts` |
| V1 API | `POST /v1/verify` — verify content + trigger payout | `pages/api/v1/verify/index.ts` |
| V1 API | `POST /v1/partners` — create partner + API key | `pages/api/v1/partners/index.ts` |
| V1 API | `POST /v1/webhooks/razorpay` — Razorpay event handler | `pages/api/v1/webhooks/razorpay.ts` |
| V1 API | `GET /v1` — API root with endpoint listing | `pages/api/v1/index.ts` |
| Tests | 27 tests for API store (partners, deals, webhooks, razorpay refs, lifecycle) | `__tests__/api-store.test.ts` |

## Priority Matrix (Updated with Expansions)

| Priority | Change | Effort | Dependencies | Status |
|----------|--------|--------|-------------|--------|
| Completed | Core API (deals, verify, partners, auth) | — | ✅ DONE |
| Completed | Razorpay integration (mock + live) | — | ✅ DONE |
| Completed | Creator Reputation Passport (Expansion 1) | 1 week | ✅ DONE |
| Completed | Anti-Fraud Network Effect (Expansion 2) | 2 weeks | ✅ DONE |
| Completed | Regulatory-Ready Ledger (Expansion 5) | 1 week | ✅ DONE |
| Completed | White-Label Dashboard (Expansion 4) | 2 weeks | ✅ DONE |
| P2 | Cookie-based auth upgrade (httpOnly) | 1h | ⬜ TODO |
| P2 | Admin: manual pass/fail + reject flow | 2h | Core API | ⬜ TODO |
| P2 | 7-day timeout auto-refund timer | 1h | Core API | ⬜ TODO |
| P2 | Webhook delivery verification (retry + monitor) | 2h | Core API | 🟡 PARTIAL |
| P3 | Instant Settlement via Credit Pool (Expansion 3) | 3 weeks | Legal check | ⬜ TODO (gated) |

## Expanded Build Sequence

### Track A — API Product (complete)
- **Week 1:** Core API shipped ✅
- **Week 2:** Creator Reputation Passport ✅
- **Week 3-4:** Anti-Fraud Network Effect ✅
- **Week 5-6:** White-Label Dashboard ✅
- **Week 7-8:** Integration testing with first partner (next step)

### Track B — Foundation (complete)
- Regulatory-Ready Ledger ✅ (built from day 1, tamper-evident hash chain)

### Track C — High-Risk/Gated (blocked)
- Instant Settlement via Credit Pool (requires regulatory check on float advances)

## Architecture Decisions

- **Monorepo approach**: API layer lives inside the existing Next.js app alongside the UI.
- **Two data stores**: `lib/data.ts` (marketplace mock) and `lib/api-store.ts` (API entity store).
- **Razorpay stub mode**: When `RAZORPAY_KEY_ID` is not set, all calls return mock responses.
- **Auth dual-path**: Cookie sessions for UI, `X-API-Key` for API, `X-Admin-Key` for admin endpoints.
- **Data moat**: The reputation passport + anti-fraud network creates defensibility that compounds with every deal — competitors can't copy this without volume.

## Key Files

| File | Purpose |
|------|---------|
| `CEO-EXPANSIONS.md` | Full specs for all 5 approved scope expansions |
| `lib/api-store.ts` | In-memory store for API entities |
| `lib/razorpay.ts` | Razorpay integration (mock + live) |
| `lib/webhooks.ts` | Webhook delivery with retry |
| `lib/types.ts` | All types including Partner, PartnerDeal, WebhookEvent |
| `pages/api/v1/` | 6 API endpoints for the API-first product |
| `__tests__/api-store.test.ts` | 27 tests for API store |
