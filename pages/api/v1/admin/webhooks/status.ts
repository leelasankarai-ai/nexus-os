import type { NextApiRequest, NextApiResponse } from 'next'
import { validateAdminKey, getWebhookDeliveryStatus } from '../../../../../lib/api-store'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const adminKey = req.headers['x-admin-key'] as string | undefined
  if (!adminKey || !validateAdminKey(adminKey)) {
    return res.status(401).json({ error: 'Invalid or missing admin key' })
  }

  const status = getWebhookDeliveryStatus()

  res.status(200).json({
    total: status.total,
    pending: status.pending,
    delivered: status.delivered,
    failed: status.failed,
    delivery_rate: status.total > 0 ? Math.round((status.delivered / status.total) * 10000) / 100 : 0,
    retry_queue: status.retryQueue,
  })
}
