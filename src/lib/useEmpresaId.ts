'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useEmpresaId() {
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    createClient()
      .from('profiles')
      .select('empresa_id')
      .single()
      .then(({ data }) => {
        setEmpresaId(data?.empresa_id ?? null)
        setLoading(false)
      })
  }, [])

  return { empresaId, loading }
}
