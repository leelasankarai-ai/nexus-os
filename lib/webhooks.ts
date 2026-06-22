import { getPendingWebhooks, markWebhookDelivered, markWebhookFailed } from './api-store'
import type { Partner } from './types'

export async function deliverWebhook(partner: Partner, url: string, payload: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NexusOS-Webhook/1.0',
        'X-Nexus-Signature': partner.webhookSecret ? signPayload(payload, partner.webhookSecret) : '',
        'X-Nexus-Event': (payload.event as string) || '',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })
    return response.ok
  } catch {
    return false
  }
}

function signPayload(payload: Record<string, unknown>, secret: string): string {
  const data = JSON.stringify(payload)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char + secret.charCodeAt(i % secret.length)
    hash |= 0
  }
  return hash.toString(36)
}

export async function processPendingWebhooks(getPartner: (id: string) => Partner | null): Promise<{ delivered: number; failed: number }> {
  const pending = getPendingWebhooks()
  let delivered = 0
  let failed = 0

  for (const wh of pending) {
    const partner = getPartner(wh.partnerId)
    if (!partner || !partner.webhookUrl) {
      markWebhookFailed(wh.id, 'No webhook URL configured')
      failed++
      continue
    }

    const ok = await deliverWebhook(partner, partner.webhookUrl, {
      event: wh.type,
      id: wh.id,
      deal_id: wh.dealId,
      created_at: wh.createdAt,
      payload: wh.payload,
    })

    if (ok) {
      markWebhookDelivered(wh.id)
      delivered++
    } else {
      markWebhookFailed(wh.id, 'HTTP request failed or timed out')
      failed++
    }
  }

  return { delivered, failed }
}
