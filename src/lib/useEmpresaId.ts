'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { garantirEmpresa } from '@/lib/garantirEmpresa'
export function useEmpresaId() {
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    garantirEmpresa().then((id) => {
      setEmpresaId(id)
      setLoading(false)
    }).catch((err) => {
      console.error('Erro no garantirEmpresa:', err)
      setEmpresaId(null)
      setLoading(false)
    })
  }, [])

  return { empresaId, loading }
}
