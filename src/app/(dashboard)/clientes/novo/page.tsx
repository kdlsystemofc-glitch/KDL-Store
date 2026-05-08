'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Esta página foi substituída pelo modal em /clientes
export default function NovoClienteRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/clientes') }, [router])
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh', gap:'0.75rem', color:'var(--texto-desab)' }}>
      <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }}/>
      <span>Redirecionando...</span>
    </div>
  )
}
