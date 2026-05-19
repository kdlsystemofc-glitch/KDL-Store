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

export function useSubscription(): SubscriptionData {
  const [data, setData] = useState<Omit<SubscriptionData, 'refetch'>>({
    plano: null,
    ativo: false,
    cancel_at_period_end: false,
    current_period_end: null,
    loading: true,
  })

  const loadData = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true }))
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setData({ plano: null, ativo: false, cancel_at_period_end: false, current_period_end: null, loading: false })
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

      setData({
        plano: sub?.plano as 'start' | 'pro' || null,
        status: sub?.status || 'inactive',
        ativo: sub?.status === 'active' || sub?.status === 'trialing',
        cancel_at_period_end: sub?.cancel_at_period_end || false,
        current_period_end: sub?.current_period_end || null,
        scheduled_plan: sub?.scheduled_plan || null,
        loading: false,
      })
    } catch (e) {
      setData(prev => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { ...data, refetch: loadData }
}
