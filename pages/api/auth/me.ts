import type { NextApiRequest, NextApiResponse } from 'next'
import type { Session } from '../../../lib/types'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookie = req.cookies['nexus_session']
  if (!cookie) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const session: Session = JSON.parse(decodeURIComponent(cookie))
    return res.status(200).json(session)
  } catch {
    res.setHeader('Set-Cookie', 'nexus_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
    return res.status(401).json({ error: 'Invalid session' })
  }
}
