'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AutoRefresh({ interval = 15000 }: { interval?: number }) {
  const router = useRouter()

  useEffect(() => {
    // Automatically refresh the current route on a timer.
    // This re-fetches the server components so the dashboard data stays fresh.
    const timer = setInterval(() => {
      router.refresh()
    }, interval)

    return () => clearInterval(timer)
  }, [router, interval])

  return null
}
