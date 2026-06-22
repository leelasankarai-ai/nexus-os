import type { NextApiRequest, NextApiResponse } from 'next'
import { createPartner } from '../../../../lib/api-store'

interface CreatePartnerRequest {
  name: string
  webhook_url?: string
}

interface CreatePartnerResponse {
  partner_id: string
  name: string
  api_key: string
  webhook_url: string | null
  sandbox: boolean
  message: string
}

interface ApiError {
  error: { code: string; message: string }
}

export default function handler(req: NextApiRequest, res: NextApiResponse<CreatePartnerResponse | ApiError>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST to create a partner' } })
  }

  const adminKey = req.headers['x-admin-key'] as string | undefined
  if (adminKey !== process.env.NEXUS_ADMIN_KEY && process.env.NODE_ENV !== 'development') {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Valid X-Admin-Key header required' } })
  }

  try {
    const { name, webhook_url } = req.body as CreatePartnerRequest

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        error: { code: 'INVALID_NAME', message: 'Partner name must be at least 2 characters' },
      })
    }

    if (webhook_url && !webhook_url.startsWith('https://')) {
      return res.status(400).json({
        error: { code: 'INVALID_WEBHOOK_URL', message: 'webhook_url must start with https://' },
      })
    }

    const { partner, apiKey } = createPartner(name.trim(), webhook_url)

    return res.status(201).json({
      partner_id: partner.id,
      name: partner.name,
      api_key: apiKey,
      webhook_url: partner.webhookUrl,
      sandbox: partner.sandbox,
      message: 'Save this API key — it will not be shown again',
    })
  } catch (err) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' },
    })
  }
}
