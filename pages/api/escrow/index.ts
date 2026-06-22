import type { NextApiRequest, NextApiResponse } from 'next'
import { getSubmissions, verifySubmission } from '../../../lib/data'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body, headers } = req
  const userRole = headers['x-user-role'] as string | undefined

  try {
    if (method === 'GET') {
      return res.status(200).json(getSubmissions())
    }

    if (method === 'POST') {
      if (userRole !== 'admin') return res.status(403).json({ error: 'Admin only' })
      const { subId } = body
      if (!subId) return res.status(400).json({ error: 'subId required' })
      const result = verifySubmission(subId)
      return res.status(200).json(result)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
