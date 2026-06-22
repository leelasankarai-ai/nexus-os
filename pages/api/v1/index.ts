import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    name: 'Nexus OS API',
    version: '1.0.0',
    endpoints: {
      deals: {
        create: 'POST /v1/deal',
        list: 'GET /v1/deals',
        get: 'GET /v1/deals/:id',
      },
      verify: {
        submit: 'POST /v1/verify',
      },
      partners: {
        create: 'POST /v1/partners',
        branding: 'GET/PUT /v1/partners/branding',
        dashboard: 'GET /v1/partners/dashboard',
      },
      reputation: {
        get: 'GET /v1/reputation/:upi_id',
        search: 'GET /v1/reputation?q=search',
      },
      fraud: {
        report: 'POST /v1/fraud/report',
        check: 'GET /v1/fraud/check/:upi_id',
        confirm: 'POST /v1/fraud/confirm',
      },
      ledger: {
        list: 'GET /v1/ledger',
        verify: 'GET /v1/ledger?verify=true',
        by_deal: 'GET /v1/ledger/:deal_id',
      },
      admin: {
        verify_deal: 'POST /v1/admin/verify/:deal_id',
        webhook_status: 'GET /v1/admin/webhooks/status',
        auto_refund: 'POST /v1/admin/auto-refund',
      },
    },
    docs: 'https://docs.nexus-os.io/v1',
  })
}
