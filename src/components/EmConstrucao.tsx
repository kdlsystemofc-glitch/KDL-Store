'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

// Componente reutilizável para páginas em construção
export default function EmConstrucao({ titulo, emoji }: { titulo?: string; emoji?: string }) {
  const router = useRouter()
  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'1rem', textAlign:'center' }}>
      <div style={{ fontSize:'4rem' }}>{emoji || '🚧'}</div>
      <h1 style={{ fontSize:'1.5rem', fontWeight:900, color:'var(--texto)' }}>
        {titulo || 'Página em construção'}
      </h1>
      <p style={{ color:'var(--texto-desab)', maxWidth:'360px', lineHeight:1.6 }}>
        Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
      </p>
      <button onClick={()=>router.back()} className="btn btn-secondary" style={{ marginTop:'0.5rem', display:'flex', alignItems:'center', gap:'0.375rem' }}>
        <ArrowLeft size={15}/> Voltar
      </button>
    </div>
  )
}
