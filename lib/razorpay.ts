import { storeRazorpayRef, getRazorpayRef, updateDealState } from './api-store'
import type { RazorpayRef } from './types'

interface RazorpayConfig {
  keyId: string
  keySecret: string
  accountNumber: string
}

const config: RazorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  accountNumber: process.env.RAZORPAY_ACCOUNT_NUMBER || '',
}

export function isConfigured(): boolean {
  return !!(config.keyId && config.keySecret && config.accountNumber)
}

export interface PaymentLinkResponse {
  id: string
  short_url: string
  status: string
  amount: number
}

export async function createPaymentLink(dealId: string, amount: number, brandPhone: string): Promise<PaymentLinkResponse> {
  if (!isConfigured()) {
    const mock: PaymentLinkResponse = {
      id: 'plink_mock_' + Date.now(),
      short_url: `https://rzp.io/i/mock_${dealId.substring(0, 8)}`,
      status: 'created',
      amount: amount * 100,
    }
    storeRazorpayRef({
      dealId,
      paymentLinkId: mock.id,
      orderId: null,
      paymentId: null,
      payoutId: null,
      status: 'pending',
    })
    return mock
  }

  const response = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64'),
    },
    body: JSON.stringify({
      amount: amount * 100,
      currency: 'INR',
      accept_partial: false,
      description: `Nexus OS deal ${dealId}`,
      customer: { contact: brandPhone },
      notify: { sms: true, email: false },
      callback_url: `https://api.nexus-os.io/v1/webhooks/razorpay`,
      callback_method: 'get',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Razorpay payment link failed: ${err}`)
  }

  const data = await response.json()
  storeRazorpayRef({
    dealId,
    paymentLinkId: data.id,
    orderId: null,
    paymentId: null,
    payoutId: null,
    status: 'pending',
  })

  return { id: data.id, short_url: data.short_url, status: data.status, amount: data.amount }
}

export interface PayoutResponse {
  id: string
  status: string
  fund_account_id: string
}

export async function createPayout(dealId: string, amount: number, upiId: string, creatorName: string): Promise<PayoutResponse> {
  if (!isConfigured()) {
    const mock: PayoutResponse = {
      id: 'pout_mock_' + Date.now(),
      status: 'processed',
      fund_account_id: 'fa_mock_' + Date.now(),
    }
    storeRazorpayRef({
      dealId,
      paymentLinkId: null,
      orderId: null,
      paymentId: null,
      payoutId: mock.id,
      status: 'payout_completed',
    })
    return mock
  }

  const fundResponse = await fetch('https://api.razorpay.com/v1/fund_accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64'),
    },
    body: JSON.stringify({
      contact_id: (await ensureContact(creatorName, upiId)).id,
      account_type: 'vpa',
      vpa: { address: upiId },
    }),
  })

  if (!fundResponse.ok) {
    const err = await fundResponse.text()
    throw new Error(`Razorpay fund account creation failed: ${err}`)
  }

  const fundData = await fundResponse.json()

  const payoutResponse = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64'),
      'X-Razorpay-Account': config.accountNumber,
    },
    body: JSON.stringify({
      fund_account_id: fundData.id,
      amount: amount * 100,
      currency: 'INR',
      mode: 'UPI',
      purpose: 'payout',
      queue_if_low_balance: true,
    }),
  })

  if (!payoutResponse.ok) {
    const err = await payoutResponse.text()
    throw new Error(`Razorpay payout failed: ${err}`)
  }

  const data = await payoutResponse.json()
  const ref = getRazorpayRef(dealId) || { dealId, paymentLinkId: null, orderId: null, paymentId: null, payoutId: null, status: 'pending' as const }
  ref.payoutId = data.id
  ref.status = 'payout_completed'
  storeRazorpayRef(ref)

  return { id: data.id, status: data.status, fund_account_id: fundData.id }
}

async function ensureContact(name: string, upiId: string): Promise<{ id: string }> {
  if (!isConfigured()) return { id: 'contact_mock_' + Date.now() }

  const response = await fetch('https://api.razorpay.com/v1/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64'),
    },
    body: JSON.stringify({
      name,
      contact: upiId.split('@')[0],
      type: 'vendor',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Razorpay contact creation failed: ${err}`)
  }

  return response.json()
}

export async function createRefund(dealId: string, amount: number): Promise<{ id: string; status: string }> {
  if (!isConfigured()) {
    return { id: 'rfnd_mock_' + Date.now(), status: 'processed' }
  }

  const ref = getRazorpayRef(dealId)
  if (!ref || !ref.paymentId) throw new Error('No payment found to refund')

  const response = await fetch(`https://api.razorpay.com/v1/payments/${ref.paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64'),
    },
    body: JSON.stringify({ amount: amount * 100 }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Razorpay refund failed: ${err}`)
  }

  return response.json()
}

export async function verifyPayment(paymentLinkId: string): Promise<boolean> {
  if (!isConfigured()) return true

  const response = await fetch(`https://api.razorpay.com/v1/payment_links/${paymentLinkId}/payments`, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64'),
    },
  })

  if (!response.ok) return false

  const data = await response.json()
  const payments = data.payment_links || []
  return payments.some((p: { status: string }) => p.status === 'captured')
}
