'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useEmpresaId() {
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }

      supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Erro ao buscar empresa_id:', error.message)
            setEmpresaId(null)
          } else {
            setEmpresaId(data?.empresa_id ?? null)
          }
          setLoading(false)
        })
    })
  }, [])

  return { empresaId, loading }
}
