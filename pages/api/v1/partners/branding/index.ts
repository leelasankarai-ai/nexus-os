import type { NextApiRequest, NextApiResponse } from 'next'
import { validateApiKey, getPartnerBranding, setPartnerBranding } from '../../../../../lib/api-store'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = req.headers['x-api-key'] as string | undefined
  const partner = !auth ? null : validateApiKey(auth)
  if (!partner) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }

  if (req.method === 'GET') {
    const branding = getPartnerBranding(partner.id)
    if (!branding) {
      return res.status(404).json({ error: 'Branding not configured. Use PUT to set it.' })
    }
    return res.status(200).json({
      company_name: branding.companyName,
      logo_url: branding.logoUrl,
      primary_color: branding.primaryColor,
      favicon_url: branding.faviconUrl,
      domain: branding.domain,
      support_email: branding.supportEmail,
    })
  }

  if (req.method === 'PUT') {
    const { company_name, logo_url, primary_color, favicon_url, domain, support_email, custom_css } = req.body
    if (!company_name) {
      return res.status(400).json({ error: 'company_name is required' })
    }

    const branding = setPartnerBranding(partner.id, {
      companyName: company_name,
      logoUrl: logo_url || undefined,
      primaryColor: primary_color || undefined,
      faviconUrl: favicon_url || undefined,
      domain: domain || undefined,
      supportEmail: support_email || undefined,
      customCss: custom_css || undefined,
    })

    return res.status(200).json({
      company_name: branding.companyName,
      logo_url: branding.logoUrl,
      primary_color: branding.primaryColor,
      domain: branding.domain,
      support_email: branding.supportEmail,
      updated_at: branding.updatedAt,
    })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
