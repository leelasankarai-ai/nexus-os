# Nexus OS — Partner Integration Quickstart

Get a working escrow + content verification flow running in under 5 minutes.

## Prerequisites

- Node.js 18+
- `npm install` in the project root

## 1. Start the server

```bash
npm run dev
# → http://localhost:3000
```

## 2. Create a partner account

```bash
curl -s -X POST http://localhost:3000/api/v1/partners \
  -H "Content-Type: application/json" \
  -d '{"name":"YourBrand","webhook_url":"https://your-webhook.com/hooks"}' | jq .
```

Save the `api_key` and `partner_id` from the response.

## 3. Create a deal (pay creator)

```bash
curl -s -X POST http://localhost:3000/api/v1/deals \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "partner_deal_id": "order-001",
    "brand_phone": "+919999999999",
    "brand_name": "YourBrand",
    "creator_upi": "creator@paytm",
    "creator_name": "Rahul",
    "amount": 5000,
    "content_type": "instagram_reel"
  }' | jq .
```

Returns a `deal_id` and `payment_link`. Amount is in paise (₹5000 = 500000).

## 4. Verify content (triggers payout)

After the creator posts content:

```bash
curl -s -X POST http://localhost:3000/api/v1/verify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "deal_id": "DEAL_ID",
    "content_url": "https://www.instagram.com/p/REEL_ID/",
    "content_type": "instagram_reel"
  }' | jq .
```

## 5. Check the ledger

```bash
curl -s http://localhost:3000/api/v1/ledger \
  -H "X-API-Key: YOUR_API_KEY" | jq .
```

## Full flow (30 seconds)

See `scripts/integration-demo.sh` (Linux/Mac) or `scripts/integration-demo.ps1` (Windows)
for an automated end-to-end demo.

## API Reference (summary)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/partners` | Register partner, get API key |
| POST | `/api/v1/deals` | Create deal + payment link |
| GET | `/api/v1/deals` | List partner deals |
| GET | `/api/v1/deals/:id` | Get deal details |
| POST | `/api/v1/verify` | Verify content, release payout |
| GET | `/api/v1/ledger` | Tamper-evident transaction log |
| GET | `/api/v1/ledger/verify` | Verify hash chain integrity |
| GET | `/api/v1/reputation/:upi_id` | Creator reputation score |
| GET | `/api/v1/fraud/check/:upi_id` | Fraud risk assessment |
| POST | `/api/v1/fraud/report` | Report suspicious activity |
| GET | `/api/v1/partners/dashboard` | White-label dashboard |
| PUT | `/api/v1/partners/branding` | Custom branding |

For the full v1 API spec, see `pages/api/v1/`.
