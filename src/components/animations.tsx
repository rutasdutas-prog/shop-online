// Lightweight CSS-only animations — no framer-motion overhead for above-the-fold content

import { ReactNode } from 'react'

// Lightweight CSS-only animations — no framer-motion overhead for above-the-fold content
export function FadeIn({ children, delay = 0, className = '' }: { children: ReactNode, delay?: number, className?: string }) {
  return (
    <div
      className={className}
      style={{
        animation: `fadeInUp 0.4s ease-out ${delay}s both`,
      }}
    >
      {children}
    </div>
  )
}

// No stagger delay — all items appear together for better LCP
export function StaggerContainer({ children, className = '' }: { children: ReactNode, className?: string }) {
  return <div className={className}>{children}</div>
}

export function StaggerItem({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div
      className={className}
      style={{ animation: 'fadeInUp 0.3s ease-out both' }}
    >
      {children}
    </div>
  )
}
