import type { NextApiRequest, NextApiResponse } from 'next'
import { validateApiKey, checkFraud } from '../../../../../lib/api-store'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = req.headers['x-api-key'] as string | undefined
  if (!auth || !validateApiKey(auth)) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }

  const { upiId } = req.query
  if (!upiId || typeof upiId !== 'string') {
    return res.status(400).json({ error: 'upiId is required' })
  }

  const check = checkFraud(upiId)

  res.status(200).json({
    creator_upi: check.creatorUpi,
    risk_level: check.riskLevel,
    recommendation: check.recommendation,
    signals: {
      total: check.signalCount,
      recent_30_days: check.recentReports,
    },
    fraud_types: check.fraudTypes,
    flagged_by_partners: check.flaggedPartnerIds.length,
  })
}
