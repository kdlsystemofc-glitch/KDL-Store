'use client'
import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePapel } from '@/hooks/usePapel'

export function OperadorOnly({ children, fallbackRedirect }: { children: ReactNode, fallbackRedirect?: string }) {
  const { isOperador, loading } = usePapel()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isOperador && fallbackRedirect) {
      router.replace(fallbackRedirect)
    }
  }, [isOperador, loading, fallbackRedirect, router])

  if (loading) return null
  if (!isOperador) return null

  return <>{children}</>
}
