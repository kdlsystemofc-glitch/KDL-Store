'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type SubscriptionData = {
  plano: 'start' | 'pro' | null
  status?: string
  ativo: boolean
  cancel_at_period_end: boolean
  current_period_end: string | null
  scheduled_plan?: 'start' | 'pro' | null
  loading: boolean
  refetch: () => void
}

const CACHE_KEY = 'kdl_subscription_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

function readCache() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed._ts > CACHE_TTL) return null
    return parsed
  } catch { return null }
}

function writeCache(data: object) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _ts: Date.now() }))
  } catch {}
}

export function useSubscription(): SubscriptionData {
  const cached = readCache()
  const [data, setData] = useState<Omit<SubscriptionData, 'refetch'>>({
    plano:                cached?.plano ?? null,
    status:               cached?.status,
    ativo:                cached?.ativo ?? false,
    cancel_at_period_end: cached?.cancel_at_period_end ?? false,
    current_period_end:   cached?.current_period_end ?? null,
    scheduled_plan:       cached?.scheduled_plan ?? null,
    loading:              !cached, // se tem cache, não exibe loading
  })

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setData(prev => ({ ...prev, loading: true }))
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const empty = { plano: null, ativo: false, cancel_at_period_end: false, current_period_end: null, loading: false } as const
      setData(empty)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!profile?.empresa_id) {
      setData({ plano: null, ativo: false, cancel_at_period_end: false, current_period_end: null, loading: false })
      return
    }

    try {
      const res = await fetch(`/api/stripe/status?empresaId=${profile.empresa_id}&t=${Date.now()}`, { cache: 'no-store' })
      const { sub } = await res.json()

      const fresh = {
        plano:                sub?.plano as 'start' | 'pro' || null,
        status:               sub?.status || 'inactive',
        ativo:                sub?.status === 'active' || sub?.status === 'trialing',
        cancel_at_period_end: sub?.cancel_at_period_end || false,
        current_period_end:   sub?.current_period_end || null,
        scheduled_plan:       sub?.scheduled_plan || null,
        loading:              false,
      }
      writeCache(fresh)
      setData(fresh)
    } catch {
      setData(prev => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    if (cached) {
      // Tem cache: atualiza em segundo plano sem mostrar loading
      loadData(true)
    } else {
      loadData(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData])

  return { ...data, refetch: () => loadData(false) }
}
