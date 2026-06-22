# Nexus OS

API-first escrow + content verification trust layer for micro-influencer platforms.
Integrate in 5 minutes — create a deal, verify content, release payout.

```bash
npm install
npm run dev        # → http://localhost:3000
```

## Partner Quickstart

```bash
# 1. Register → get API key
curl -X POST http://localhost:3000/api/v1/partners \
  -H "Content-Type: application/json" \
  -d '{"name":"YourBrand"}'

# 2. Create deal → get payment link
curl -X POST http://localhost:3000/api/v1/deals \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"partner_deal_id":"order-1","brand_phone":"+919999999999","creator_upi":"creator@paytm","amount":50000,"content_type":"instagram_reel"}'

# 3. Verify content → trigger payout
curl -X POST http://localhost:3000/api/v1/verify \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deal_id":"DEAL_ID","content_url":"https://instagr.am/p/REEL"}'
```

See [`QUICKSTART.md`](QUICKSTART.md) for the full guide, `scripts/integration-demo.ps1` (Windows) or `scripts/integration-demo.sh` (Linux/Mac) for an automated demo, and `scripts/nexus-os.postman_collection.json` for Postman.

## Demo Accounts

| Role    | Email              | Password | KYC Tier  |
|---------|--------------------|----------|-----------|
| Brand   | brand@nexus.io     | brand    | Verified  |
| Brand   | fresh@nexus.io     | fresh    | Basic     |
| Creator | creator@nexus.io   | creator  | Verified  |
| Creator | arjun@nexus.io     | arjun    | Basic     |
| Admin   | admin@nexus.io     | admin    | Business  |

## Architecture

```
nexus-os/
├── pages/           # Next.js pages + 7 API routes
│   ├── api/auth/    # login, logout, me
│   ├── api/campaigns/
│   ├── api/deals/
│   ├── api/escrow/
│   ├── api/payments/
│   └── api/notifications/
├── components/      # React components by role
├── context/         # AuthContext (role-based auth + KYC)
├── lib/             # types.ts + data.ts (mock store with audit)
├── styles/          # Tailwind + custom CSS
└── *.md             # Reviews + rebuild plan
```

## Tech Stack

- Next.js 14 (pages router + API routes)
- TypeScript (strict mode)
- React 18
- Tailwind CSS 3 (dark theme, glass-card design)
- Vitest (unit tests — add before shipping)

## Key Features

- **45s → 15s** escrow settlement with animated progress
- **3 roles** — Brand Dashboard, Creator Studio, Admin Escrow
- **Pan-India** — 37 states/UTs, 200+ cities
- **KYC tiers** — Guest → Basic → Verified → Business
- **Dispute resolution** — Open → Resolved/Refunded
- **Creator reputation** — Ratings, badges, completion rate
- **API-first** — 7 REST API routes with session validation
- **Batch escrow release** — Select + release multiple at once
- **Toast notifications** — Success/error feedback
- **Mobile bottom nav** — Touch-optimized navigation

## Design Decisions

See `REBUILD-PLAN.md` for the full gstack review synthesis.
- `PLAN.md` — Original unicorn master plan
- `CEO-REVIEW.md` — Product strategy, TAM, flywheel gaps
- `ENG-REVIEW.md` — Architecture, error handling, security
- `DESIGN-REVIEW.md` — Visual design, accessibility, polish
- `DEVEX-REVIEW.md` — Developer experience, tooling, CI/CD
