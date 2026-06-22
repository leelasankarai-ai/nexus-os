import { type ReactNode, useEffect, useRef, useCallback } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      prevFocusRef.current = document.activeElement as HTMLElement
      document.addEventListener('keydown', handleKeyDown)
      requestAnimationFrame(() => {
        modalRef.current?.querySelector<HTMLElement>('button, input, [href]')?.focus()
      })
    } else {
      document.body.style.overflow = ''
      prevFocusRef.current?.focus()
    }
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div ref={modalRef} className="bg-nexus-800 border border-nexus-600/30 rounded-2xl p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">{title}</h2>
          <button onClick={onClose} className="text-nexus-400 hover:text-white text-lg leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-400 rounded" aria-label="Close">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}