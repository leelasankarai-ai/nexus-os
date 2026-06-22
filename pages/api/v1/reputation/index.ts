import type { NextApiRequest, NextApiResponse } from 'next'
import { validateApiKey, searchCreatorProfiles } from '../../../../lib/api-store'
import type { ReputationQueryResponse } from '../../../../lib/types'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = req.headers['x-api-key'] as string | undefined
  if (!auth || !validateApiKey(auth)) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }

  const q = req.query.q as string | undefined
  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query parameter q is required' })
  }

  const profiles = searchCreatorProfiles(q)

  const results: ReputationQueryResponse[] = profiles.map(profile => ({
    upi_id: profile.upiId,
    display_name: profile.displayName,
    score: profile.score,
    total_deals: profile.dealCount,
    completion_rate: profile.dealCount > 0
      ? Math.round((profile.completedDeals / profile.dealCount) * 100) / 100
      : 0,
    on_time_rate: Math.round(profile.onTimeRate * 100) / 100,
    avg_engagement_rate: Math.round(profile.avgEngagementRate * 100) / 100,
    total_earned: profile.totalEarned,
    badges: profile.badges,
    first_seen: profile.firstSeenAt,
    last_active: profile.lastActivityAt,
  }))

  res.status(200).json({ results })
}
