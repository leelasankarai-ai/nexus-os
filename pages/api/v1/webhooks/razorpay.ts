import type { NextApiRequest, NextApiResponse } from 'next'
import { getDeal, updateDealState, createWebhook, getRazorpayRef, storeRazorpayRef } from '../../../../lib/api-store'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (webhookSecret) {
    const signature = req.headers['x-razorpay-signature'] as string
    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' })
    }
    const expected = createSignature(req.body, webhookSecret)
    if (signature !== expected) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
  }

  const event = req.body.event as string
  const payload = req.body.payload as Record<string, any> | undefined

  if (!event || !payload) {
    return res.status(400).json({ error: 'Invalid webhook payload' })
  }

  try {
    if (event === 'payment_link.paid') {
      const paymentLink = payload.payment_link || {}
      const linkId = paymentLink.id

      const refs = await import('../../../../lib/api-store')
      const allRefs = refs as any

      const dealId = Object.keys(allRefs).length > 0 ? linkId?.replace('plink_', 'deal_') : null

      if (dealId) {
        updateDealState(dealId, 'payment_received')
        createWebhook({
          partnerId: '',
          dealId,
          type: 'deal.paid',
          payload: { payment_link_id: linkId, paid_at: new Date().toISOString() },
        })
      }
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Webhook processing failed' })
  }
}

function createSignature(body: any, secret: string): string {
  const data = JSON.stringify(body)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i) + secret.charCodeAt(i % secret.length)
    hash |= 0
  }
  return hash.toString(36)
}
