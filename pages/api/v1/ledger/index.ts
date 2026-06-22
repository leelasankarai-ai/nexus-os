import type { NextApiRequest, NextApiResponse } from 'next'
import { validateApiKey, getLedgerEntries, verifyLedgerChain, getLedgerHashChainSummary } from '../../../../lib/api-store'
import type { LedgerEntryType, LedgerExportRow } from '../../../../lib/types'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = req.headers['x-api-key'] as string | undefined
  if (!auth || !validateApiKey(auth)) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }

  const { partner_id, from, to, type, verify } = req.query

  const entries = getLedgerEntries({
    partnerId: partner_id as string | undefined,
    fromDate: from as string | undefined,
    toDate: to as string | undefined,
    entryType: type as LedgerEntryType | undefined,
  })

  if (verify === 'true') {
    const chain = verifyLedgerChain()
    const summary = getLedgerHashChainSummary()
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

    return res.status(200).json({
      chain_valid: chain.valid,
      entries_checked: chain.entriesChecked,
      summary,
      entries: rows,
    })
  }

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

  res.status(200).json({ entries: rows })
}
