import type { NextApiRequest, NextApiResponse } from 'next'
import { validateAdminKey, getDeal, updateDealState, appendLedgerEntry, createWebhook, getPartners } from '../../../../../lib/api-store'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const adminKey = req.headers['x-admin-key'] as string | undefined
  if (!adminKey || !validateAdminKey(adminKey)) {
    return res.status(401).json({ error: 'Invalid or missing admin key' })
  }

  const { dealId } = req.query
  if (!dealId || typeof dealId !== 'string') {
    return res.status(400).json({ error: 'dealId is required' })
  }

  const { action, notes } = req.body
  if (!action || !['pass', 'fail'].includes(action)) {
    return res.status(400).json({ error: "action must be 'pass' or 'fail'" })
  }

  const deal = getDeal(dealId)
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found' })
  }

  if (deal.state === 'verified') {
    return res.status(409).json({ error: 'Deal already verified' })
  }
  if (deal.state === 'refunded' || deal.state === 'expired') {
    return res.status(409).json({ error: `Deal is in '${deal.state}' state` })
  }

  const partnerName = getPartners().find(p => p.id === deal.partnerId)?.name || 'Unknown'

  if (action === 'pass') {
    updateDealState(deal.id, 'verified', { verifiedAt: new Date().toISOString() })

    appendLedgerEntry({
      dealId: deal.id,
      partnerId: deal.partnerId,
      partnerDealId: deal.partnerDealId,
      creatorUpi: deal.creatorUpi,
      entryType: 'verification_passed',
      amount: deal.amount,
      fee: deal.fee,
      netAmount: deal.netAmount,
      metadata: { admin_override: true, notes: notes || 'Admin manual pass' },
    })

    createWebhook({
      partnerId: deal.partnerId,
      dealId: deal.id,
      type: 'deal.verified',
      payload: {
        deal_id: deal.id,
        partner_deal_id: deal.partnerDealId,
        admin_override: true,
        notes: notes || null,
        verified_at: new Date().toISOString(),
      },
    })

    return res.status(200).json({
      deal_id: deal.id,
      state: 'verified',
      action: 'passed',
      verified_at: new Date().toISOString(),
    })
  }

  if (action === 'fail') {
    updateDealState(deal.id, 'rejected', { verifiedAt: new Date().toISOString() })

    appendLedgerEntry({
      dealId: deal.id,
      partnerId: deal.partnerId,
      partnerDealId: deal.partnerDealId,
      creatorUpi: deal.creatorUpi,
      entryType: 'verification_failed',
      amount: deal.amount,
      fee: deal.fee,
      netAmount: deal.netAmount,
      metadata: { admin_override: true, notes: notes || 'Admin manual reject', partner: partnerName },
    })

    createWebhook({
      partnerId: deal.partnerId,
      dealId: deal.id,
      type: 'deal.rejected',
      payload: {
        deal_id: deal.id,
        partner_deal_id: deal.partnerDealId,
        admin_override: true,
        notes: notes || null,
        rejected_at: new Date().toISOString(),
      },
    })

    return res.status(200).json({
      deal_id: deal.id,
      state: 'rejected',
      action: 'failed',
      rejected_at: new Date().toISOString(),
    })
  }

  return res.status(500).json({ error: 'Unexpected error' })
}
