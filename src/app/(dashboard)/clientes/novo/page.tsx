'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

export default function NovoClientePage() {
  const [salvando, setSalvando] = useState(false)
  const [tipo, setTipo] = useState<'varejo'|'atacado'|'vip'>('varejo')

  return (
    <div className="anim-fade" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div className="pg-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Link href="/clientes" className="btn btn-secondary" style={{ padding: '0.4rem 0.625rem' }}>
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="pg-titulo">👤 Novo Cliente</h1>
            <p className="pg-sub">Cadastre um novo cliente</p>
          </div>
        </div>
      </div>

      {/* Dados */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sec-header"><span>📋 Dados do Cliente</span></div>
        <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label className="campo-label">Nome completo *</label>
            <input id="cli-nome" className="campo" placeholder="Ex: João Silva" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="campo-label">Telefone / WhatsApp *</label>
              <input id="cli-tel" className="campo" placeholder="(11) 99999-0000" />
            </div>
            <div>
              <label className="campo-label">CPF (opcional)</label>
              <input id="cli-cpf" className="campo" style={{ fontFamily: 'monospace' }} placeholder="000.000.000-00" />
            </div>
          </div>
          <div>
            <label className="campo-label">E-mail (opcional)</label>
            <input id="cli-email" className="campo" type="email" placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="campo-label">Endereço (opcional)</label>
            <input id="cli-end" className="campo" placeholder="Rua, número, bairro, cidade" />
          </div>
          <div>
            <label className="campo-label">Anotações (opcional)</label>
            <textarea id="cli-obs" className="campo" rows={2} style={{ resize: 'none' }} placeholder="Ex: Prefere pagar no PIX, interessa por eletrônicos..." />
          </div>
        </div>
      </div>

      {/* Tipo */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sec-header"><span>🏷️ Tipo de Cliente</span></div>
        <div style={{ padding: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            {(['varejo','atacado','vip'] as const).map(t => (
              <button key={t} onClick={() => setTipo(t)} type="button"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: `2px solid ${tipo===t?'var(--verde)':'var(--borda)'}`,
                  background: tipo===t ? 'var(--verde-claro)' : 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit',
                  color: tipo===t ? 'var(--verde-esc)' : 'var(--texto-sec)', fontWeight: 700 }}>
                {t==='varejo'?'🏪 Varejo':t==='atacado'?'📦 Atacado':'⭐ VIP'}
                <p style={{ fontSize: '0.68rem', fontWeight: 400, marginTop: '3px', color: 'inherit' }}>
                  {t==='varejo'?'Preço normal':t==='atacado'?'Preço atacado':'Preço especial'}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/clientes" className="btn btn-ghost">Cancelar</Link>
        <button id="btn-salvar-cliente" className="btn btn-primary" onClick={async()=>{setSalvando(true);await new Promise(r=>setTimeout(r,800));setSalvando(false)}}>
          {salvando?<><Loader2 size={15}/> Salvando...</>:<><Save size={15}/> Salvar cliente</>}
        </button>
      </div>
    </div>
  )
}
