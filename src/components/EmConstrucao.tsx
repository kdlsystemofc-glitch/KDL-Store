'use client'
import { useRouter } from 'next/navigation'

// Componente reutilizável para páginas em construção
export default function EmConstrucao({ titulo }: { titulo?: string; emoji?: string }) {
  const router = useRouter()
  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'0.75rem', textAlign:'center' }}>
      <p style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'var(--verde)', letterSpacing:'0.12em' }}>// MÓDULO EM DESENVOLVIMENTO //</p>
      <p style={{ fontFamily:'monospace', fontSize:'1rem', fontWeight:900, color:'var(--texto)', letterSpacing:'0.08em' }}>
        {(titulo || 'PÁGINA EM CONSTRUÇÃO').toUpperCase()}<span className="blink">_</span>
      </p>
      <p style={{ color:'var(--texto-desab)', maxWidth:'360px', lineHeight:1.6, fontSize:'0.78rem', letterSpacing:'0.04em' }}>
        ESTA FUNCIONALIDADE ESTÁ SENDO DESENVOLVIDA E ESTARÁ DISPONÍVEL EM BREVE.
      </p>
      <button onClick={()=>router.back()} className="btn btn-secondary" style={{ marginTop:'0.5rem', fontSize:'0.72rem' }}>
        ← VOLTAR
      </button>
    </div>
  )
}
