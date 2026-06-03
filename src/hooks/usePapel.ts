'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePapel() {
  const [papel, setPapel] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('papel').eq('id', user.id).single()
        if (data?.papel) setPapel(data.papel)
      }
      setLoading(false)
    }
    carregar()
  }, [])

  const isAdmin = papel === 'admin'
  const isOperador = papel === 'admin' || papel === 'operador' || papel === 'vendedor' || papel === 'estoquista' || papel === 'visualizador'
  const isVisualizador = papel === 'visualizador' || papel === 'estoquista'

  return { papel, isAdmin, isOperador, isVisualizador, loading }
}
