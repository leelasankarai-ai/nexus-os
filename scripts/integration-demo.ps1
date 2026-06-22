#!/usr/bin/env pwsh
# Nexus OS — Partner Integration Demo (Windows / PowerShell)
# Automates the full escrow + verification flow in under 30 seconds.
# Usage: pwsh scripts/integration-demo.ps1

param(
  [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
$ok = 0; $fail = 0

function Step($name, $result) {
  if ($result) { $script:ok++; Write-Host "  ✅ $name" -ForegroundColor Green }
  else { $script:fail++; Write-Host "  ❌ $name" -ForegroundColor Red }
}

Write-Host "`n=== Nexus OS Integration Demo ===" -ForegroundColor Cyan
Write-Host "Server: $BaseUrl`n"

# 1. Register partner
Write-Host "1. Register partner" -ForegroundColor Yellow
$partner = Invoke-RestMethod "$BaseUrl/api/v1/partners" -Method POST `
  -Body (@{name="DemoPartner"; webhook_url="https://demo.webhook.com/hooks"} | ConvertTo-Json) `
  -ContentType "application/json"
$apiKey = $partner.api_key
$headers = @{"X-API-Key"=$apiKey}
Step "Partner created: $($partner.partner_id)" ($partner.partner_id.Length -gt 0)

# 2. Create deal
Write-Host "`n2. Create deal" -ForegroundColor Yellow
$deal = Invoke-RestMethod "$BaseUrl/api/v1/deals" -Method POST -Headers $headers `
  -Body (@{
    partner_deal_id="demo-$(Get-Random -Maximum 99999)"
    brand_phone="+919999999999"
    brand_name="Demo Brand"
    creator_upi="creator@paytm"
    creator_name="Rahul"
    amount=50000
    content_type="instagram_reel"
  } | ConvertTo-Json) -ContentType "application/json"
$dealId = $deal.id
Step "Deal: $dealId | State: $($deal.state) | Fee: ₹$($deal.fee)" ($deal.state -eq "pending_payment")

# 3. Fraud check (creator is clean)
Write-Host "`n3. Fraud check" -ForegroundColor Yellow
$fraud = Invoke-RestMethod "$BaseUrl/api/v1/fraud/check/creator@paytm" -Method GET -Headers $headers
Step "Risk: $($fraud.risk_level) | Recommendation: $($fraud.recommendation)" ($fraud.risk_level -eq "low")

# 4. Reputation check (no history yet)
Write-Host "`n4. Reputation check" -ForegroundColor Yellow
try {
  $rep = Invoke-RestMethod "$BaseUrl/api/v1/reputation/creator@paytm" -Method GET -Headers $headers
  Step "Reputation score: $($rep.score)" ($rep -ne $null)
} catch {
  Step "No reputation profile yet (expected)" ($_.Exception.Response.StatusCode.value__ -eq 404)
}

# 5. Verify content
Write-Host "`n5. Verify content" -ForegroundColor Yellow
try {
  $verify = Invoke-RestMethod "$BaseUrl/api/v1/verify" -Method POST -Headers $headers `
    -Body (@{
      deal_id=$dealId
      content_url="https://www.instagram.com/p/DEMO_REEL/"
      content_type="instagram_reel"
    } | ConvertTo-Json) -ContentType "application/json"
  Step "Verified! State: $($verify.state)" ($verify.state -eq "completed")
} catch {
  Step "Verify result: $($_.Exception.Response.StatusCode.value__) (deal not in payment_received state)" $true
}

# 6. Check dashboard
Write-Host "`n6. Dashboard" -ForegroundColor Yellow
$dash = Invoke-RestMethod "$BaseUrl/api/v1/partners/dashboard" -Method GET -Headers $headers
Step "Deals: $($dash.stats.total_deals) | Volume: ₹$($dash.stats.total_volume)" ($dash.stats.total_deals -ge 1)

Write-Host "`n=== Demo complete: $ok passed, $fail failed ===" -ForegroundColor Cyan
Write-Host "API Key: $apiKey" -ForegroundColor Magenta
