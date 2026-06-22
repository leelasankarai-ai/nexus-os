import type { NextApiRequest, NextApiResponse } from 'next'
import { getTransactions } from '../../../lib/data'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, headers } = req
  const userId = headers['x-user-id'] as string | undefined

  try {
    if (method === 'GET') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' })
      return res.status(200).json(getTransactions())
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
