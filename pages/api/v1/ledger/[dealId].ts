import type { NextApiRequest, NextApiResponse } from 'next'
import { validateApiKey, getDealLedger } from '../../../../lib/api-store'
import type { LedgerExportRow } from '../../../../lib/types'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = req.headers['x-api-key'] as string | undefined
  if (!auth || !validateApiKey(auth)) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }

  const { dealId } = req.query
  if (!dealId || typeof dealId !== 'string') {
    return res.status(400).json({ error: 'dealId is required' })
  }

  const entries = getDealLedger(dealId)

  const rows: LedgerExportRow[] = entries.map(e => ({
    entry_id: e.id,
    deal_id: e.dealId,
    partner_deal_id: e.partnerDealId,
    partner_id: e.partnerId,
    creator_upi: e.creatorUpi,
    event: e.entryType,
    amount: e.amount,
    fee: e.fee,
    net_amount: e.netAmount,
    hash: e.hash,
    previous_hash: e.previousHash,
    timestamp: e.createdAt,
  }))

  res.status(200).json({ deal_id: dealId, entries: rows })
}
