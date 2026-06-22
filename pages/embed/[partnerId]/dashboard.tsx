import { useState, useEffect } from 'react'
import type { GetServerSideProps } from 'next'
import { getPartnerBranding, getWhiteLabelDashboard } from '../../../lib/api-store'
import type { WhiteLabelDashboardData } from '../../../lib/types'

interface Props {
  initialData: WhiteLabelDashboardData | null
  error?: string
}

export default function WhiteLabelDashboard({ initialData, error }: Props) {
  const [data, setData] = useState<WhiteLabelDashboardData | null>(initialData)
  const [loading, setLoading] = useState(!initialData && !error)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const apiKey = params.get('api_key')
    if (!apiKey) {
      setLoading(false)
      return
    }
    fetch('/api/v1/partners/dashboard', {
      headers: { 'x-api-key': apiKey },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (error) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif', color: '#ef4444' }}>{error}</div>
  }

  if (loading) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>Loading...</div>
  }

  if (!data) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>No data available</div>
  }

  const primaryColor = data.partner.primary_color || '#6366f1'

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: 0, margin: 0 }}>
      <div style={{
        background: primaryColor,
        color: '#fff',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {data.partner.logo_url && (
          <img src={data.partner.logo_url} alt="" style={{ height: 32, width: 32, borderRadius: 6, objectFit: 'contain' }} />
        )}
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{data.partner.name}</div>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Nexus OS — White-Label Dashboard v{data.version}</div>
        </div>
      </div>

      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatBox label="Total Deals" value={data.stats.total_deals} />
        <StatBox label="Active" value={data.stats.active_deals} />
        <StatBox label="Completed" value={data.stats.completed_deals} />
        <StatBox label="Verified Rate" value={`${data.stats.verified_rate}%`} />
        <StatBox label="Total Volume" value={`₹${(data.stats.total_volume / 100).toLocaleString()}`} />
        <StatBox label="Total Fees" value={`₹${(data.stats.total_fees / 100).toLocaleString()}`} />
      </div>

      <div style={{ padding: '0 24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Recent Deals</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '8px 4px' }}>Creator</th>
              <th style={{ padding: '8px 4px' }}>UPI</th>
              <th style={{ padding: '8px 4px' }}>Amount</th>
              <th style={{ padding: '8px 4px' }}>Status</th>
              <th style={{ padding: '8px 4px' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_deals.map(deal => (
              <tr key={deal.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '8px 4px' }}>{deal.creator_name}</td>
                <td style={{ padding: '8px 4px', fontFamily: 'monospace', fontSize: 12 }}>{deal.creator_upi}</td>
                <td style={{ padding: '8px 4px' }}>₹{(deal.amount / 100).toLocaleString()}</td>
                <td style={{ padding: '8px 4px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 500,
                    background: deal.state === 'verified' || deal.state === 'paid' ? '#d1fae5' :
                      deal.state === 'rejected' || deal.state === 'refunded' ? '#fee2e2' : '#dbeafe',
                    color: deal.state === 'verified' || deal.state === 'paid' ? '#065f46' :
                      deal.state === 'rejected' || deal.state === 'refunded' ? '#991b1b' : '#1e40af',
                  }}>
                    {deal.state.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '8px 4px', fontSize: 12, color: '#6b7280' }}>
                  {new Date(deal.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { partnerId } = ctx.query
  if (!partnerId || typeof partnerId !== 'string') {
    return { props: { initialData: null, error: 'Missing partner ID' } }
  }
  const branding = getPartnerBranding(partnerId)
  if (!branding) {
    return { props: { initialData: null, error: 'Partner not found or branding not configured' } }
  }
  const data = getWhiteLabelDashboard(partnerId)
  return { props: { initialData: data } }
}
