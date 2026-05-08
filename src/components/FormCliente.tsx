'use client'
import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'

export function FormCliente({ onSuccess, onCancel }: { onSuccess: () => void; onCancel?: () => void }) {
  const { empresaId } = useEmpresaId()
  const [salvando, setSalvando] = useState(false)
  const [tipo,     setTipo]     = useState<'varejo'|'atacado'|'vip'>('varejo')
  const [erro,     setErro]     = useState<string|null>(null)

  const salvar = async () => {
    setErro(null)
    const nome = (document.getElementById('cli-nome') as HTMLInputElement)?.value?.trim()
    if (!nome) { setErro('O nome do cliente é obrigatório.'); return }
    setSalvando(true)
    const supabase = createClient()
    if (!empresaId) { setErro('Erro ao identificar sua empresa.'); setSalvando(false); return }
    const { error } = await supabase.from('clientes').insert({
      empresa_id: empresaId,
      nome,
      telefone:  (document.getElementById('cli-tel')   as HTMLInputElement)?.value || null,
      cpf:       (document.getElementById('cli-cpf')   as HTMLInputElement)?.value || null,
      email:     (document.getElementById('cli-email') as HTMLInputElement)?.value || null,
      endereco:  (document.getElementById('cli-end')   as HTMLInputElement)?.value || null,
      anotacoes: (document.getElementById('cli-obs')   as HTMLTextAreaElement)?.value || null,
      tipo,
    })
    setSalvando(false)
    if (error) { setErro('Erro ao salvar: ' + error.message); return }
    onSuccess()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      {erro && <div className="alerta alerta-perigo">{erro}</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        <div>
          <label className="campo-label">Nome completo *</label>
          <input id="cli-nome" className="campo" placeholder="Ex: João Silva" style={{ marginTop:'0.375rem' }}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          <div>
            <label className="campo-label">Telefone / WhatsApp</label>
            <input id="cli-tel" className="campo" style={{ marginTop:'0.375rem' }} placeholder="(11) 99999-0000"/>
          </div>
          <div>
            <label className="campo-label">CPF (opcional)</label>
            <input id="cli-cpf" className="campo" style={{ marginTop:'0.375rem', fontFamily:'monospace' }} placeholder="000.000.000-00"/>
          </div>
        </div>
        <div>
          <label className="campo-label">E-mail (opcional)</label>
          <input id="cli-email" className="campo" type="email" style={{ marginTop:'0.375rem' }} placeholder="email@exemplo.com"/>
        </div>
        <div>
          <label className="campo-label">Endereço (opcional)</label>
          <input id="cli-end" className="campo" style={{ marginTop:'0.375rem' }} placeholder="Rua, número, bairro, cidade"/>
        </div>
        <div>
          <label className="campo-label">Anotações (opcional)</label>
          <textarea id="cli-obs" className="campo" rows={2} style={{ marginTop:'0.375rem', resize:'none' }}
            placeholder="Ex: Prefere pagar no PIX, interessa por eletrônicos..."/>
        </div>
      </div>

      <div>
        <label className="campo-label" style={{ marginBottom:'0.5rem', display:'block' }}>Tipo de Cliente</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem' }}>
          {(['varejo','atacado','vip'] as const).map(t => (
            <button key={t} onClick={() => setTipo(t)} type="button"
              style={{
                padding:'0.75rem', borderRadius:'var(--radius-sm)',
                border:`2px solid ${tipo===t?'var(--verde)':'var(--borda)'}`,
                background: tipo===t ? 'var(--verde-claro)' : 'var(--surface)',
                cursor:'pointer', fontFamily:'inherit',
                color: tipo===t ? 'var(--verde-esc)' : 'var(--texto-sec)', fontWeight:700
              }}>
              {t==='varejo'?'🏪 Varejo':t==='atacado'?'📦 Atacado':'⭐ VIP'}
              <p style={{ fontSize:'0.68rem', fontWeight:400, marginTop:'3px', color:'inherit' }}>
                {t==='varejo'?'Preço normal':t==='atacado'?'Preço atacado':'Preço especial'}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem', marginTop:'0.5rem' }}>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>}
        <button id="btn-salvar-cliente" className="btn btn-primary" disabled={salvando} onClick={salvar}
          style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
          {salvando ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> Salvando...</> : <><Save size={15}/> Salvar cliente</>}
        </button>
      </div>
    </div>
  )
}
