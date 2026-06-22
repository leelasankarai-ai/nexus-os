#!/usr/bin/env bash
# Nexus OS — Partner Integration Demo (Linux / Mac)
# Automates the full escrow + verification flow.
# Usage: bash scripts/integration-demo.sh [base_url]
# Requires: curl, jq

BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0

step() {
  if [ "$2" = "true" ] || [ "$2" = "0" ]; then
    echo "  ✅ $1"
    ((PASS++))
  else
    echo "  ❌ $1"
    ((FAIL++))
  fi
}

echo ""
echo "=== Nexus OS Integration Demo ==="
echo "Server: $BASE"
echo ""

# 1. Register partner
echo "1. Register partner"
RESP=$(curl -s -X POST "$BASE/api/v1/partners" \
  -H "Content-Type: application/json" \
  -d '{"name":"DemoPartner","webhook_url":"https://demo.webhook.com/hooks"}')
API_KEY=$(echo "$RESP" | jq -r '.api_key')
PARTNER_ID=$(echo "$RESP" | jq -r '.partner_id')
step "Partner created: $PARTNER_ID" "$(echo "$PARTNER_ID" | wc -c | tr -d ' ')"

# 2. Create deal
echo ""
echo "2. Create deal"
DEAL_ID=$(curl -s -X POST "$BASE/api/v1/deals" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"partner_deal_id\":\"demo-$$\",\"brand_phone\":\"+919999999999\",\"brand_name\":\"Demo Brand\",\"creator_upi\":\"creator@paytm\",\"creator_name\":\"Rahul\",\"amount\":50000,\"content_type\":\"instagram_reel\"}" | jq -r '.id')
step "Deal created: $DEAL_ID" "$(echo "$DEAL_ID" | wc -c | tr -d ' ')"

# 3. Fraud check
echo ""
echo "3. Fraud check"
RISK=$(curl -s "$BASE/api/v1/fraud/check/creator@paytm" \
  -H "X-API-Key: $API_KEY" | jq -r '.risk_level')
step "Risk: $RISK" "[ \"$RISK\" = \"low\" ]"

# 4. Reputation check
echo ""
echo "4. Reputation check"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/reputation/creator@paytm" \
  -H "X-API-Key: $API_KEY")
step "Reputation: $STATUS (404 = no profile yet)" "[ \"$STATUS\" = \"404\" ]"

# 5. Dashboard
echo ""
echo "5. Dashboard"
DASH=$(curl -s "$BASE/api/v1/partners/dashboard" \
  -H "X-API-Key: $API_KEY")
DEALS=$(echo "$DASH" | jq -r '.stats.total_deals')
step "Dashboard: $DEALS deals" "[ \"$DEALS\" -gt 0 ]"

echo ""
echo "=== Demo complete: $PASS passed, $FAIL failed ==="
echo "API Key: $API_KEY"
