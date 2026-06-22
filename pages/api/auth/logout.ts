import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Set-Cookie', 'nexus_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
  return res.status(200).json({ ok: true })
}
