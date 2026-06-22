import type { NextApiRequest, NextApiResponse } from 'next'
import { validateApiKey, getDeal } from '../../../../lib/api-store'
import type { PartnerDeal } from '../../../../lib/types'

interface ApiError {
  error: { code: string; message: string }
}

export default function handler(req: NextApiRequest, res: NextApiResponse<PartnerDeal | ApiError>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET to retrieve a deal' } })
  }

  const apiKey = req.headers['x-api-key'] as string | undefined
  if (!apiKey) {
    return res.status(401).json({ error: { code: 'MISSING_API_KEY', message: 'X-API-Key header required' } })
  }

  const partner = validateApiKey(apiKey)
  if (!partner) {
    return res.status(401).json({ error: { code: 'INVALID_API_KEY', message: 'API key is invalid or deactivated' } })
  }

  const { id } = req.query
  const deal = getDeal(id as string)

  if (!deal) {
    return res.status(404).json({ error: { code: 'DEAL_NOT_FOUND', message: 'No deal found with this ID' } })
  }

  if (deal.partnerId !== partner.id) {
    return res.status(403).json({ error: { code: 'DEAL_NOT_YOURS', message: 'This deal does not belong to your partner account' } })
  }

  return res.status(200).json(deal)
}
