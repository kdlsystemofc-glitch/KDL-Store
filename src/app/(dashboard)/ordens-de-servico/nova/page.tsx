'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

export default function NovaOSPage() {
  const [salvando, setSalvando] = useState(false)

  return (
    <div className="anim-fade" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div className="pg-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Link href="/ordens-de-servico" className="btn btn-secondary" style={{ padding: '0.4rem 0.625rem' }}>
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="pg-titulo">🔧 Nova Ordem de Serviço</h1>
            <p className="pg-sub">Registre um serviço técnico</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sec-header"><span>👤 Cliente e Equipamento</span></div>
        <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="campo-label">Cliente *</label>
              <input id="os-cliente" className="campo" placeholder="Nome ou telefone..." />
            </div>
            <div>
              <label className="campo-label">Técnico responsável</label>
              <input id="os-tecnico" className="campo" placeholder="Ex: Pedro Souza" />
            </div>
          </div>
          <div>
            <label className="campo-label">Descrição do serviço *</label>
            <input id="os-servico" className="campo" placeholder="Ex: Instalação de som automotivo" />
          </div>
          <div>
            <label className="campo-label">Equipamento / Produto</label>
            <input id="os-equipamento" className="campo" placeholder="Ex: Som JBL Stage 200, modelo 2023" />
          </div>
          <div>
            <label className="campo-label">Defeito relatado pelo cliente</label>
            <textarea id="os-defeito" className="campo" rows={2} style={{ resize: 'none' }} placeholder="Descreva o que o cliente relatou..." />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sec-header"><span>💰 Valores e Prazo</span></div>
        <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="campo-label">Valor do serviço (R$) *</label>
              <input id="os-valor" type="number" min="0" step="0.01" className="campo" placeholder="0,00" />
            </div>
            <div>
              <label className="campo-label">Previsão de entrega</label>
              <input id="os-previsao" type="date" className="campo" />
            </div>
            <div>
              <label className="campo-label">Status inicial</label>
              <select id="os-status" className="campo">
                <option value="aberta">Aberta</option>
                <option value="em_andamento">Em andamento</option>
              </select>
            </div>
          </div>
          <div>
            <label className="campo-label">Observações internas (opcional)</label>
            <textarea id="os-obs" className="campo" rows={2} style={{ resize: 'none' }} placeholder="Notas internas para o técnico..." />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/ordens-de-servico" className="btn btn-ghost">Cancelar</Link>
        <button id="btn-salvar-os" className="btn btn-primary" onClick={async()=>{setSalvando(true);await new Promise(r=>setTimeout(r,800));setSalvando(false)}}>
          {salvando?<><Loader2 size={15}/> Salvando...</>:<><Save size={15}/> Abrir OS</>}
        </button>
      </div>
    </div>
  )
}
