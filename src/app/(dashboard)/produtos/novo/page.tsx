'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { generateSKU } from '@/lib/utils'

const categorias = ['Eletrônicos', 'Acessórios', 'Serviços', 'Vestuário', 'Papelaria', 'Outros']

export default function NovoProdutoPage() {
  const router = useRouter()
  const [sku, setSku] = useState(generateSKU())
  const [custo, setCusto] = useState(0)
  const [venda, setVenda] = useState(0)
  const [garantiaOn, setGarantiaOn] = useState(false)
  const [brinde, setBrinde] = useState(false)
  const [modoCompleto, setModoCompleto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const margem = venda > 0 ? ((venda - custo) / venda) * 100 : 0

  const salvar = async () => {
    setSalvando(true)
    await new Promise(r => setTimeout(r, 900))
    setSalvando(false)
  }

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: '780px' }}>

      <div className="pg-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button onClick={() => router.back()} className="btn btn-secondary" style={{ padding: '0.4rem 0.625rem' }}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="pg-titulo">📦 Novo Produto</h1>
            <p className="pg-sub">Preencha as informações do produto</p>
          </div>
        </div>
      </div>

      {/* Modo básico/completo */}
      <div className="card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{modoCompleto ? '📦 Modo Completo' : '⚡ Modo Rápido (Recomendado para começar)'}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--texto-desab)' }}>{modoCompleto ? 'Todos os campos disponíveis' : 'Só o essencial: nome, preço e quantidade'}</p>
        </div>
        <button type="button" onClick={() => setModoCompleto(v => !v)} className="btn btn-secondary" style={{ fontSize: '0.8rem', flexShrink: 0 }}>
          {modoCompleto ? '− Modo Rápido' : '+ Configurações avançadas'}
        </button>
      </div>

      {/* 1. Identificação */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            </Field>
            <Field label="Categoria">
              <select id="prod-categoria" className="campo">
                <option value="">Selecionar...</option>
                {categorias.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </FieldRow>
          <Field label="Descrição (opcional)">
            <textarea id="prod-descricao" className="campo" rows={2} style={{ resize: 'none' }}
              placeholder="Descrição curta do produto..." />
          </Field>
        </div>
      </div>

      {/* 2. Preços */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sec-header"><span>💰 Preços</span></div>
        <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <FieldRow>
            <Field label="Preço de custo *">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--texto-desab)', fontSize: '0.875rem' }}>R$</span>
                <input id="prod-custo" type="number" step="0.01" min="0" className="campo"
                  style={{ paddingLeft: '2rem', fontWeight: 800, fontSize: '1.1rem' }}
                  placeholder="0,00" onChange={e => setCusto(parseFloat(e.target.value) || 0)} />
              </div>
            </Field>
            <Field label="Preço de venda — Varejo *">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--texto-desab)', fontSize: '0.875rem' }}>R$</span>
                <input id="prod-venda" type="number" step="0.01" min="0" className="campo"
                  style={{ paddingLeft: '2rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--verde)' }}
                  placeholder="0,00" onChange={e => setVenda(parseFloat(e.target.value) || 0)} />
              </div>
            </Field>
            <Field label="Margem de lucro">
              <div className="campo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem', cursor: 'default',
                color: margem >= 30 ? 'var(--verde)' : margem > 0 ? 'var(--amarelo)' : 'var(--texto-desab)'
              }}>
                {margem > 0 ? `${margem.toFixed(1)}%` : '—'}
              </div>
              {margem > 0 && (
                <p style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: '3px',
                  color: margem >= 50 ? 'var(--verde)' : margem >= 30 ? 'var(--amarelo)' : 'var(--vermelho)' }}>
                  {margem >= 50 ? '● Ótima margem' : margem >= 30 ? '● Boa margem' : '● Margem baixa'}
                </p>
              )}
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Preço de venda — Atacado">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--texto-desab)', fontSize: '0.875rem' }}>R$</span>
                <input id="prod-atacado" type="number" step="0.01" min="0" className="campo" style={{ paddingLeft: '2rem' }} placeholder="0,00" />
              </div>
            </Field>
            <Field label="Preço de venda — VIP">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--texto-desab)', fontSize: '0.875rem' }}>R$</span>
                <input id="prod-vip" type="number" step="0.01" min="0" className="campo" style={{ paddingLeft: '2rem' }} placeholder="0,00" />
              </div>
            </Field>
            <Field label="Preço mínimo (PDV)">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--texto-desab)', fontSize: '0.875rem' }}>R$</span>
                <input id="prod-minimo" type="number" step="0.01" min="0" className="campo" style={{ paddingLeft: '2rem' }} placeholder="limite de desconto" />
              </div>
            </Field>
          </FieldRow>
        </div>
      </div>

      {/* 3. Estoque */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sec-header"><span>📉 Estoque</span></div>
        <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <FieldRow>
            <Field label="Quantidade inicial">
              <input id="prod-estoque" type="number" min="0" className="campo" defaultValue={0}
                style={{ textAlign: 'center', fontWeight: 900, fontSize: '1.25rem' }} />
            </Field>
            <Field label="Estoque mínimo">
              <input id="prod-estoque-min" type="number" min="0" className="campo" defaultValue={5}
                style={{ textAlign: 'center', fontWeight: 700 }} />
              <p style={{ fontSize: '0.72rem', color: 'var(--amarelo)', marginTop: '3px', fontWeight: 600 }}>⚠ Alerta abaixo deste valor</p>
            </Field>
            <Field label="Localização">
              <input id="prod-local" className="campo" placeholder="Ex: Prateleira A3" />
            </Field>
          </FieldRow>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--borda)', borderRadius: 'var(--radius-sm)' }}>
            <input id="prod-serie" type="checkbox" style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: 'var(--verde)', cursor: 'pointer', flexShrink: 0 }} />
            <div>
              <label htmlFor="prod-serie" style={{ fontWeight: 700, cursor: 'pointer' }}>Rastrear número de série</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--texto-desab)', marginTop: '2px' }}>Habilita campo de nº de série ao registrar uma venda (recomendado para eletrônicos)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Garantia */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sec-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🛡️ Garantia</span>
          <button id="prod-toggle-garantia" type="button" onClick={() => setGarantia(!garantia)}
            style={{ position: 'relative', width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: garantia ? 'var(--verde)' : '#666', transition: 'background 0.2s', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              left: garantia ? '22px' : '2px', transition: 'left 0.2s' }} />
          </button>
        </div>
        <div style={{ padding: '0.875rem' }}>
          {!garantia
            ? <p style={{ fontSize: '0.82rem', color: 'var(--texto-desab)' }}>Ative para configurar garantia automática neste produto.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <FieldRow>
                  <Field label="Prazo de garantia (dias) *">
                    <input id="prod-prazo" type="number" min="1" className="campo"
                      style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}
                      placeholder="90" />
                    <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)', marginTop: '3px' }}>Ex: 90 dias = 3 meses</p>
                  </Field>
                </FieldRow>
                <Field label="Texto do termo de garantia">
                  <textarea id="prod-texto-garantia" className="campo" rows={3} style={{ resize: 'none' }}
                    placeholder="Ex: Garantia contra defeitos de fabricação por 90 dias. Não cobre danos físicos ou mau uso." />
                </Field>
              </div>
            )
          }
        </div>
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem' }}>
        <Link href="/produtos" className="btn btn-ghost">Cancelar</Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary">Salvar e criar outro</button>
          <button id="btn-salvar-produto" type="button" onClick={salvar} disabled={salvando} className="btn btn-primary">
            {salvando ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : <><Save size={15} /> Salvar produto</>}
          </button>
        </div>
      </div>
    </div>
  )
}
