import type { NextApiRequest, NextApiResponse } from 'next'
import { validateApiKey, getWhiteLabelDashboard } from '../../../../lib/api-store'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = req.headers['x-api-key'] as string | undefined
  const partner = !auth ? null : validateApiKey(auth)
  if (!partner) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }

  const dashboard = getWhiteLabelDashboard(partner.id)
  if (!dashboard) {
    return res.status(404).json({ error: 'Partner not found' })
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json(dashboard)
}
