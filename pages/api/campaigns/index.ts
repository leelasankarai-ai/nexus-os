import type { NextApiRequest, NextApiResponse } from 'next'
import { getCampaigns, createCampaign } from '../../../lib/data'
import type { CampaignTier } from '../../../lib/types'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, headers } = req
  const userId = headers['x-user-id'] as string | undefined

  try {
    if (method === 'GET') {
      return res.status(200).json(getCampaigns())
    }

    if (method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' })
      const campaign = createCampaign({
        brandName: req.body.brandName,
        name: req.body.name,
        budget: Number(req.body.budget),
        tier: req.body.tier as CampaignTier,
        ageMin: req.body.ageMin,
        ageMax: req.body.ageMax,
        targetNiches: req.body.targetNiches,
        minER: req.body.minER,
        deadline: req.body.deadline,
      })
      return res.status(201).json(campaign)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
