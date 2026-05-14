'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type SubscriptionData = {
  plano: 'start' | 'pro' | null
  ativo: boolean
  loading: boolean
}

export function useSubscription(): SubscriptionData {
  const [data, setData] = useState<SubscriptionData>({ plano: null, ativo: false, loading: true })

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setData({ plano: null, ativo: false, loading: false }); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

      if (!profile?.empresa_id) { setData({ plano: null, ativo: false, loading: false }); return }

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plano, status')
        .eq('empresa_id', profile.empresa_id)
        .single()

      setData({
        plano: sub?.plano as 'start' | 'pro' || null,
        ativo: sub?.status === 'active',
        loading: false,
      })
    }
    fetch()
  }, [])

  return data
}
