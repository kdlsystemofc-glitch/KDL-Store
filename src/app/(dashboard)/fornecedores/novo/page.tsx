'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

const categorias = ['Eletrônicos', 'Acessórios', 'Vestuário', 'Papelaria', 'Alimentação', 'Geral']

export default function NovoFornecedorPage() {
  const [salvando, setSalvando] = useState(false)

  return (
    <div className="anim-fade" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div className="pg-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Link href="/fornecedores" className="btn btn-secondary" style={{ padding: '0.4rem 0.625rem' }}>
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="pg-titulo">🚚 Novo Fornecedor</h1>
            <p className="pg-sub">Cadastre um fornecedor</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sec-header"><span>📋 Dados do Fornecedor</span></div>
        <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label className="campo-label">Nome da empresa *</label>
            <input id="forn-nome" className="campo" placeholder="Ex: JBL Distribuidora SP" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="campo-label">Nome do contato</label>
              <input id="forn-contato" className="campo" placeholder="Ex: Sandro" />
            </div>
            <div>
              <label className="campo-label">Telefone / WhatsApp *</label>
              <input id="forn-tel" className="campo" placeholder="(11) 99999-0000" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="campo-label">Categoria de produtos</label>
              <select id="forn-categoria" className="campo">
                <option value="">Selecionar...</option>
                {categorias.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="campo-label">Cidade</label>
              <input id="forn-cidade" className="campo" placeholder="São Paulo" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="campo-label">Prazo de entrega</label>
              <select id="forn-prazo" className="campo">
                <option>24h</option><option>48h</option><option>72h</option><option>1 semana</option>
              </select>
            </div>
            <div>
              <label className="campo-label">Pedido mínimo (R$)</label>
              <input id="forn-min" type="number" min="0" className="campo" placeholder="0,00" />
            </div>
          </div>
          <div>
            <label className="campo-label">Anotações (opcional)</label>
            <textarea id="forn-obs" className="campo" rows={2} style={{ resize: 'none' }} placeholder="Condições de pagamento, descontos por volume, etc." />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/fornecedores" className="btn btn-ghost">Cancelar</Link>
        <button id="btn-salvar-fornecedor" className="btn btn-primary" onClick={async()=>{setSalvando(true);await new Promise(r=>setTimeout(r,800));setSalvando(false)}}>
          {salvando?<><Loader2 size={15}/> Salvando...</>:<><Save size={15}/> Salvar fornecedor</>}
        </button>
      </div>
    </div>
  )
}
