import type { NextApiRequest, NextApiResponse } from 'next'
import { validateApiKey, createDeal, getPartnerDeals, getDealByPartnerRef } from '../../../../lib/api-store'
import { createPaymentLink } from '../../../../lib/razorpay'
import type { PartnerDeal } from '../../../../lib/types'

interface ApiError {
  error: {
    code: string
    message: string
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<PartnerDeal | PartnerDeal[] | ApiError>) {
  const apiKey = req.headers['x-api-key'] as string | undefined
  if (!apiKey) {
    return res.status(401).json({ error: { code: 'MISSING_API_KEY', message: 'X-API-Key header required' } })
  }

  const partner = validateApiKey(apiKey)
  if (!partner) {
    return res.status(401).json({ error: { code: 'INVALID_API_KEY', message: 'API key is invalid or deactivated' } })
  }

  try {
    if (req.method === 'POST') {
      const { partner_deal_id, brand_phone, brand_name, creator_upi, creator_name, amount, content_type } = req.body

      if (!partner_deal_id || !brand_phone || !creator_upi || !amount) {
        return res.status(400).json({
          error: { code: 'MISSING_FIELDS', message: 'partner_deal_id, brand_phone, creator_upi, and amount are required' },
        })
      }

      const existing = getDealByPartnerRef(partner.id, partner_deal_id)
      if (existing) {
        return res.status(409).json({
          error: { code: 'DUPLICATE_DEAL', message: 'A deal with this partner_deal_id already exists' },
        })
      }

      if (amount < 100) {
        return res.status(400).json({
          error: { code: 'MINIMUM_AMOUNT', message: 'Minimum deal amount is ₹100' },
        })
      }

      if (amount > 100000) {
        return res.status(400).json({
          error: { code: 'MAXIMUM_AMOUNT', message: 'Maximum deal amount is ₹100,000' },
        })
      }

      if (creator_upi && !creator_upi.includes('@')) {
        return res.status(400).json({
          error: { code: 'INVALID_UPI', message: 'creator_upi must be a valid UPI ID (e.g. name@upi)' },
        })
      }

      const deal = createDeal({
        partnerId: partner.id,
        partnerDealId: partner_deal_id,
        brandPhone: brand_phone,
        brandName: brand_name || brand_phone,
        creatorUpi: creator_upi,
        creatorName: creator_name || creator_upi.split('@')[0],
        amount,
        contentType: content_type || 'instagram_reel',
      })

      try {
        const paymentLink = await createPaymentLink(deal.id, deal.netAmount, brand_phone)
        deal.paymentLink = paymentLink.short_url
        deal.paymentLinkId = paymentLink.id
      } catch {
        return res.status(502).json({
          error: { code: 'PAYMENT_GATEWAY_ERROR', message: 'Failed to create payment link. Check Razorpay configuration.' },
        })
      }

      const { createWebhook } = await import('../../../../lib/api-store')
      createWebhook({
        partnerId: partner.id,
        dealId: deal.id,
        type: 'deal.created',
        payload: { deal_id: deal.id, partner_deal_id: deal.partnerDealId, amount: deal.amount },
      })

      return res.status(201).json(deal)
    }

    if (req.method === 'GET') {
      const deals = getPartnerDeals(partner.id)
      return res.status(200).json(deals)
    }

    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST to create a deal or GET to list deals' } })
  } catch (err) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' },
    })
  }
}
