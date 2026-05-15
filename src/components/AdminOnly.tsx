'use client'
import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePapel } from '@/hooks/usePapel'

export function AdminOnly({ children, fallbackRedirect }: { children: ReactNode, fallbackRedirect?: string }) {
  const { isAdmin, loading } = usePapel()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin && fallbackRedirect) {
      router.replace(fallbackRedirect)
    }
  }, [isAdmin, loading, fallbackRedirect, router])

  if (loading) return null
  if (!isAdmin) return null

  return <>{children}</>
}
