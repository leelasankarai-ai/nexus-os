import type { NextApiRequest, NextApiResponse } from 'next'
import { validateApiKey, confirmFraud, getFraudReports } from '../../../../lib/api-store'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = req.headers['x-api-key'] as string | undefined
  const partner = !auth ? null : validateApiKey(auth)
  if (!partner) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }

  const { report_id, confirmed } = req.body
  if (!report_id || typeof confirmed !== 'boolean') {
    return res.status(400).json({ error: 'report_id (string) and confirmed (boolean) are required' })
  }

  const report = getFraudReports().find(r => r.id === report_id)
  if (!report) {
    return res.status(404).json({ error: 'Fraud report not found' })
  }
  if (report.partnerId !== partner.id) {
    return res.status(403).json({ error: 'Fraud report does not belong to this partner' })
  }

  const updated = confirmFraud(report_id, confirmed)
  if (!updated) {
    return res.status(500).json({ error: 'Failed to update fraud report' })
  }

  res.status(200).json({
    report_id: updated.id,
    confirmed: updated.confirmed,
    resolved_at: updated.resolvedAt,
  })
}
