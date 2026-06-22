export const ENV = {
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_ACCOUNT_NUMBER: process.env.RAZORPAY_ACCOUNT_NUMBER || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  NEXUS_ADMIN_KEY: process.env.NEXUS_ADMIN_KEY || '',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  PLATFORM_FEE: Number(process.env.NEXT_PUBLIC_PLATFORM_FEE) || 0.05,
}
