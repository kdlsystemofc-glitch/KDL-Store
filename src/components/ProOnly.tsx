'use client'

import { useSubscription } from '@/hooks/useSubscription'
import Link from 'next/link'

/**
 * Envolve features exclusivas do plano Pro.
 * Se o plano é Start, mostra overlay com upsell.
 */
export function ProOnly({ children }: { children: React.ReactNode }) {
  const { plano, loading } = useSubscription()

  if (loading) return <>{children}</>
  if (plano === 'pro') return <>{children}</>

  return null
}
