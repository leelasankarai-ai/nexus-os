import type { NextApiRequest, NextApiResponse } from 'next'
import { getDeals, acceptDeal, submitDealContent } from '../../../lib/data'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body, headers } = req
  const userId = headers['x-user-id'] as string | undefined

  try {
    if (method === 'GET') {
      return res.status(200).json(getDeals())
    }

    if (method === 'PATCH') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' })
      const { action, dealId, url } = body
      if (action === 'accept') {
        const deal = acceptDeal(dealId, userId)
        return res.status(200).json(deal)
      }
      if (action === 'submit') {
        const deal = submitDealContent(dealId, userId, url)
        return res.status(200).json(deal)
      }
      return res.status(400).json({ error: 'Invalid action' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
