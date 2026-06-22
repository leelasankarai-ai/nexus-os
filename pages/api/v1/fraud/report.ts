import type { NextApiRequest, NextApiResponse } from 'next'
import { validateApiKey, reportFraud, getDeal, checkFraud } from '../../../../lib/api-store'
import type { FraudType } from '../../../../lib/types'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = req.headers['x-api-key'] as string | undefined
  const partner = !auth ? null : validateApiKey(auth)
  if (!partner) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }

  const { deal_id, fraud_type, description, evidence } = req.body
  if (!deal_id || !fraud_type || !description) {
    return res.status(400).json({ error: 'deal_id, fraud_type, and description are required' })
  }

  const validTypes: FraudType[] = ['fake_content', 'non_delivery', 'suspicious_engagement', 'identity_mismatch', 'duplicate_creator', 'rapid_escalation']
  if (!validTypes.includes(fraud_type)) {
    return res.status(400).json({ error: `Invalid fraud_type. Must be one of: ${validTypes.join(', ')}` })
  }

  const deal = getDeal(deal_id)
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found' })
  }
  if (deal.partnerId !== partner.id) {
    return res.status(403).json({ error: 'Deal does not belong to this partner' })
  }

  const result = reportFraud({
    partnerId: partner.id,
    dealId: deal_id,
    creatorUpi: deal.creatorUpi,
    fraudType: fraud_type,
    description,
    evidence: evidence || undefined,
  })

  const check = checkFraud(deal.creatorUpi)

  res.status(201).json({
    report_id: result.report.id,
    fraud_type: result.report.fraudType,
    creator_upi: result.report.creatorUpi,
    risk_level: check.riskLevel,
    recommendation: check.recommendation,
    signals: {
      total_reports: result.signal.reportCount,
      confirmed_reports: result.signal.confirmedCount,
      unique_partners: result.signal.uniquePartnerIds.length,
      fraud_types: result.signal.fraudTypes,
    },
  })
}
