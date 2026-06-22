# Nexus OS

Hyper-local fintech platform connecting micro-influencers with local brands across India. Instant escrow-backed payouts, real-time campaign tracking, fraud-proof content verification.

## Quick Start

```bash
npm install
npm run dev        # → http://localhost:3000
```

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
