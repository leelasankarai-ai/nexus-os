import type { NextApiRequest, NextApiResponse } from 'next'
import { validateAdminKey, checkExpiredDeals } from '../../../../lib/api-store'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const adminKey = req.headers['x-admin-key'] as string | undefined
  if (!adminKey || !validateAdminKey(adminKey)) {
    return res.status(401).json({ error: 'Invalid or missing admin key' })
  }

  const result = checkExpiredDeals()

  res.status(200).json({
    refunded: result.refunded,
    expired: result.expired,
    checked_at: new Date().toISOString(),
  })
}
