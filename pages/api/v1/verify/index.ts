import type { NextApiRequest, NextApiResponse } from 'next'
import { validateApiKey, getDeal, updateDealState, createWebhook } from '../../../../lib/api-store'
import { createPayout } from '../../../../lib/razorpay'
import type { PartnerDeal } from '../../../../lib/types'

interface VerifyRequest {
  deal_id: string
  content_url: string
  content_type?: string
}

interface VerifyResponse {
  deal: PartnerDeal
  verification: {
    status: 'passed' | 'failed' | 'pending_review'
    url_exists: boolean
    checked_at: string
  }
}

interface ApiError {
  error: {
    code: string
    message: string
  }
}

async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) })
    return response.ok
  } catch {
    return false
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<VerifyResponse | ApiError>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST to verify content' } })
  }

  const apiKey = req.headers['x-api-key'] as string | undefined
  if (!apiKey) {
    return res.status(401).json({ error: { code: 'MISSING_API_KEY', message: 'X-API-Key header required' } })
  }

  const partner = validateApiKey(apiKey)
  if (!partner) {
    return res.status(401).json({ error: { code: 'INVALID_API_KEY', message: 'API key is invalid or deactivated' } })
  }

  try {
    const { deal_id, content_url } = req.body as VerifyRequest

    if (!deal_id || !content_url) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'deal_id and content_url are required' },
      })
    }

    if (!content_url.startsWith('http://') && !content_url.startsWith('https://')) {
      return res.status(400).json({
        error: { code: 'INVALID_URL', message: 'content_url must be a valid HTTP(S) URL' },
      })
    }

    const deal = getDeal(deal_id)
    if (!deal) {
      return res.status(404).json({ error: { code: 'DEAL_NOT_FOUND', message: 'No deal found with this ID' } })
    }

    if (deal.partnerId !== partner.id) {
      return res.status(403).json({ error: { code: 'DEAL_NOT_YOURS', message: 'This deal does not belong to your partner account' } })
    }

    if (deal.state !== 'payment_received') {
      return res.status(409).json({
        error: { code: 'INVALID_STATE', message: `Deal is in '${deal.state}' state. Must be 'payment_received' to verify.` },
      })
    }

    const urlExists = await checkUrlExists(content_url)

    if (!urlExists) {
      updateDealState(deal.id, 'rejected', {
        contentUrl: content_url,
        verifiedAt: new Date().toISOString(),
      })

      createWebhook({
        partnerId: partner.id,
        dealId: deal.id,
        type: 'deal.rejected',
        payload: {
          deal_id: deal.id,
          partner_deal_id: deal.partnerDealId,
          reason: 'content_url_not_accessible',
          checked_at: new Date().toISOString(),
        },
      })

      const updatedDeal = getDeal(deal.id)!
      return res.status(200).json({
        deal: updatedDeal,
        verification: {
          status: 'failed',
          url_exists: false,
          checked_at: new Date().toISOString(),
        },
      })
    }

    updateDealState(deal.id, 'verified', {
      contentUrl: content_url,
      verifiedAt: new Date().toISOString(),
    })

    try {
      await createPayout(deal.id, deal.netAmount, deal.creatorUpi, deal.creatorName)
      updateDealState(deal.id, 'verified', {
        razorpayPayoutId: deal.razorpayPayoutId,
      })
    } catch {
      updateDealState(deal.id, 'verified', {
        contentUrl: content_url,
        verifiedAt: new Date().toISOString(),
      })
    }

    createWebhook({
      partnerId: partner.id,
      dealId: deal.id,
      type: 'deal.verified',
      payload: {
        deal_id: deal.id,
        partner_deal_id: deal.partnerDealId,
        content_url,
        verified_at: new Date().toISOString(),
      },
    })

    const updatedDeal = getDeal(deal.id)!
    return res.status(200).json({
      deal: updatedDeal,
      verification: {
        status: 'passed',
        url_exists: true,
        checked_at: new Date().toISOString(),
      },
    })
  } catch (err) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' },
    })
  }
}
