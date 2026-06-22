import { useEffect } from 'react'
import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../components/Toast'
import { startSim, stopSim } from '../lib/data'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    startSim()
    return () => stopSim()
  }, [])

  return (
    <AuthProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </AuthProvider>
  )
}
