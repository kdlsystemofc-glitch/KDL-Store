'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { generateSKU } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { garantirEmpresa } from '@/lib/garantirEmpresa'

const categorias = ['Eletrônicos', 'Acessórios', 'Serviços', 'Vestuário', 'Papelaria', 'Outros']

export default function NovoProdutoPage() {
  const router = useRouter()
  const [sku,          setSku]          = useState(generateSKU())
  const [custo,        setCusto]        = useState(0)
  const [venda,        setVenda]        = useState(0)
  const [garantia,     setGarantia]     = useState(false)
  const [brinde,       setBrinde]       = useState(false)
  const [modoCompleto, setModoCompleto] = useState(false)
  const [salvando,     setSalvando]     = useState(false)
  const [erro,         setErro]         = useState<string|null>(null)

  const margem = venda > 0 ? ((venda - custo) / venda) * 100 : 0

  const salvar = async () => {
    setErro(null)
    const nome = (document.getElementById('prod-nome') as HTMLInputElement)?.value?.trim()
    if (!nome) { setErro('O nome do produto é obrigatório.'); return }
    if (venda <= 0) { setErro('Informe o preço de venda.'); return }
    setSalvando(true)
    const supabase = createClient()
    const empresaId = await garantirEmpresa()
    if (!empresaId) { setErro('Erro ao identificar sua empresa.'); setSalvando(false); return }
    const { error } = await supabase.from('produtos').insert({
      empresa_id:  empresaId,
      nome,
      sku:         (document.getElementById('prod-sku') as HTMLInputElement)?.value || sku,
      categoria:   (document.getElementById('prod-categoria') as HTMLSelectElement)?.value || null,
      descricao:   (document.getElementById('prod-descricao') as HTMLTextAreaElement)?.value || null,
      preco_custo: custo,
      preco_varejo: venda,
      preco_atacado: parseFloat((document.getElementById('prod-atacado') as HTMLInputElement)?.value) || null,
      preco_vip:    parseFloat((document.getElementById('prod-vip') as HTMLInputElement)?.value) || null,
      preco_minimo: parseFloat((document.getElementById('prod-minimo') as HTMLInputElement)?.value) || null,
      qtd_atual:   parseInt((document.getElementById('prod-estoque') as HTMLInputElement)?.value) || 0,
      qtd_minima:  parseInt((document.getElementById('prod-estoque-min') as HTMLInputElement)?.value) || 0,
      localizacao: (document.getElementById('prod-local') as HTMLInputElement)?.value || null,
      pode_ser_brinde: brinde,
      tem_garantia: garantia,
      dias_garantia: garantia ? parseInt((document.getElementById('prod-prazo') as HTMLInputElement)?.value) || null : null,
      texto_garantia: garantia ? (document.getElementById('prod-texto-garantia') as HTMLTextAreaElement)?.value || null : null,
    })
    setSalvando(false)
    if (error) { setErro('Erro ao salvar: ' + error.message); return }
    router.push('/produtos')
  }

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: '780px' }}>

      {/* Header */}
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

      {/* Toggle modo */}
      <div className="card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>
            {modoCompleto ? '📦 Modo Completo' : '⚡ Modo Rápido (Recomendado para começar)'}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--texto-desab)' }}>
            {modoCompleto ? 'Todos os campos disponíveis' : 'Só o essencial: nome, preço e quantidade'}
          </p>
        </div>
        <button type="button" onClick={() => setModoCompleto(v => !v)}
          className="btn btn-secondary" style={{ fontSize: '0.8rem', flexShrink: 0 }}>
          {modoCompleto ? '− Modo Rápido' : '+ Configurações avançadas'}
        </button>
      </div>

      {/* 1. Identificação */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sec-header"><span>🏷️ Identificação</span></div>
        <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          <div>
            <label className="campo-label">Nome do produto *</label>
            <input id="prod-nome" className="campo" style={{ marginTop: '0.375rem' }}
              placeholder="Ex: Som JBL Stage 200" />
          </div>

          {modoCompleto && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem' }}>
                <div>
                  <label className="campo-label">SKU / Código *</label>
                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.375rem' }}>
                    <input className="campo" style={{ flex: 1, fontFamily: 'monospace' }}
                      value={sku} onChange={e => setSku(e.target.value)} placeholder="Ex: SOM-001" />
                    <button type="button" onClick={() => setSku(generateSKU())}
                      className="btn btn-secondary" style={{ padding: '0.375rem 0.5rem', flexShrink: 0 }}>↺</button>
                  </div>
                </div>
                <div>
                  <label className="campo-label">Código de barras (opcional)</label>
                  <input id="prod-barcode" className="campo" style={{ marginTop: '0.375rem', fontFamily: 'monospace' }}
                    placeholder="EAN-13" />
                </div>
                <div>
                  <label className="campo-label">Categoria</label>
                  <select id="prod-categoria" className="campo" style={{ marginTop: '0.375rem' }}>
                    <option value="">Selecionar...</option>
                    {categorias.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="campo-label">Descrição (opcional)</label>
                <textarea id="prod-descricao" className="campo" rows={2}
                  style={{ marginTop: '0.375rem', resize: 'none' }}
                  placeholder="Descrição curta do produto..." />
              </div>
            </>
          )}

          {/* Toggle brinde */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer',
            userSelect: 'none', padding: '0.625rem', background: 'var(--surface-alt)',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--borda)' }}>
            <input type="checkbox" checked={brinde} onChange={e => setBrinde(e.target.checked)}
              style={{ accentColor: 'var(--verde)', width: '16px', height: '16px' }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>🎁 Pode ser usado como brinde</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--texto-desab)' }}>
                Aparece primeiro na busca de brindes no PDV
              </p>
            </div>
          </label>

        </div>
      </div>

      {/* 2. Preços */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sec-header"><span>💰 Preços</span></div>
        <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem' }}>
            {/* Custo */}
            <div>
              <label className="campo-label">Preço de custo *</label>
              <div style={{ position: 'relative', marginTop: '0.375rem' }}>
                <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                  fontWeight: 700, color: 'var(--texto-desab)', fontSize: '0.875rem' }}>R$</span>
                <input id="prod-custo" type="number" step="0.01" min="0" className="campo"
                  style={{ paddingLeft: '2rem', fontWeight: 800, fontSize: '1.1rem' }}
                  placeholder="0,00" onChange={e => setCusto(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            {/* Venda varejo */}
            <div>
              <label className="campo-label">Preço de venda — Varejo *</label>
              <div style={{ position: 'relative', marginTop: '0.375rem' }}>
                <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                  fontWeight: 700, color: 'var(--texto-desab)', fontSize: '0.875rem' }}>R$</span>
                <input id="prod-venda" type="number" step="0.01" min="0" className="campo"
                  style={{ paddingLeft: '2rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--verde)' }}
                  placeholder="0,00" onChange={e => setVenda(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            {/* Margem */}
            <div>
              <label className="campo-label">Margem de lucro</label>
              <div className="campo" style={{ marginTop: '0.375rem', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem', cursor: 'default',
                color: margem >= 30 ? 'var(--verde)' : margem > 0 ? 'var(--amarelo)' : 'var(--texto-desab)' }}>
                {margem > 0 ? `${margem.toFixed(1)}%` : '—'}
              </div>
              {margem > 0 && (
                <p style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: '3px',
                  color: margem >= 50 ? 'var(--verde)' : margem >= 30 ? 'var(--amarelo)' : 'var(--vermelho)' }}>
                  {margem >= 50 ? '● Ótima margem' : margem >= 30 ? '● Boa margem' : '● Margem baixa'}
                </p>
              )}
            </div>
          </div>

          {modoCompleto && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem' }}>
              <div>
                <label className="campo-label">Preço Atacado</label>
                <div style={{ position: 'relative', marginTop: '0.375rem' }}>
                  <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                    fontWeight: 700, color: 'var(--texto-desab)', fontSize: '0.875rem' }}>R$</span>
                  <input id="prod-atacado" type="number" step="0.01" min="0" className="campo"
                    style={{ paddingLeft: '2rem' }} placeholder="0,00" />
                </div>
              </div>
              <div>
                <label className="campo-label">Preço VIP</label>
                <div style={{ position: 'relative', marginTop: '0.375rem' }}>
                  <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                    fontWeight: 700, color: 'var(--texto-desab)', fontSize: '0.875rem' }}>R$</span>
                  <input id="prod-vip" type="number" step="0.01" min="0" className="campo"
                    style={{ paddingLeft: '2rem' }} placeholder="0,00" />
                </div>
              </div>
              <div>
                <label className="campo-label">Preço mínimo (PDV)</label>
                <div style={{ position: 'relative', marginTop: '0.375rem' }}>
                  <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                    fontWeight: 700, color: 'var(--texto-desab)', fontSize: '0.875rem' }}>R$</span>
                  <input id="prod-minimo" type="number" step="0.01" min="0" className="campo"
                    style={{ paddingLeft: '2rem' }} placeholder="limite de desconto" />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 3. Estoque */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sec-header"><span>📉 Estoque</span></div>
        <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem' }}>
            <div>
              <label className="campo-label">Quantidade inicial</label>
              <input id="prod-estoque" type="number" min="0" className="campo"
                style={{ marginTop: '0.375rem', textAlign: 'center', fontWeight: 900, fontSize: '1.25rem' }}
                defaultValue={0} />
            </div>
            <div>
              <label className="campo-label">Estoque mínimo</label>
              <input id="prod-estoque-min" type="number" min="0" className="campo"
                style={{ marginTop: '0.375rem', textAlign: 'center', fontWeight: 700 }}
                defaultValue={5} />
              <p style={{ fontSize: '0.72rem', color: 'var(--amarelo)', marginTop: '3px', fontWeight: 600 }}>
                ⚠ Alerta abaixo deste valor
              </p>
            </div>
            <div>
              <label className="campo-label">Localização</label>
              <input id="prod-local" className="campo" style={{ marginTop: '0.375rem' }}
                placeholder="Ex: Prateleira A3, Gaveta C2" />
            </div>
          </div>

          {modoCompleto && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer',
              padding: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--borda)',
              borderRadius: 'var(--radius-sm)' }}>
              <input id="prod-serie" type="checkbox"
                style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: 'var(--verde)', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700 }}>Rastrear número de série</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--texto-desab)', marginTop: '2px' }}>
                  Habilita campo de nº de série ao registrar uma venda (recomendado para eletrônicos)
                </p>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* 4. Garantia (só modo completo) */}
      {modoCompleto && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sec-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🛡️ Garantia</span>
            <button type="button" onClick={() => setGarantia(v => !v)}
              style={{ position: 'relative', width: '44px', height: '24px', borderRadius: '12px',
                border: 'none', cursor: 'pointer', flexShrink: 0,
                background: garantia ? 'var(--verde)' : '#666', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: '2px', width: '20px', height: '20px',
                borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                left: garantia ? '22px' : '2px', transition: 'left 0.2s' }} />
            </button>
          </div>
          <div style={{ padding: '0.875rem' }}>
            {!garantia
              ? <p style={{ fontSize: '0.82rem', color: 'var(--texto-desab)' }}>
                  Ative para configurar garantia automática neste produto.
                </p>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label className="campo-label">Prazo de garantia (dias) *</label>
                    <input id="prod-prazo" type="number" min="1" className="campo"
                      style={{ marginTop: '0.375rem', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', maxWidth: '160px' }}
                      placeholder="90" />
                    <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)', marginTop: '3px' }}>
                      Ex: 90 dias = 3 meses
                    </p>
                  </div>
                  <div>
                    <label className="campo-label">Texto do termo de garantia</label>
                    <textarea id="prod-texto-garantia" className="campo" rows={3}
                      style={{ marginTop: '0.375rem', resize: 'none' }}
                      placeholder="Ex: Garantia contra defeitos de fabricação por 90 dias. Não cobre danos físicos ou mau uso." />
                  </div>
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem' }}>
        <Link href="/produtos" className="btn btn-ghost">Cancelar</Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary">Salvar e criar outro</button>
          <button id="btn-salvar-produto" type="button" onClick={salvar} disabled={salvando} className="btn btn-primary">
            {salvando
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
              : <><Save size={15} /> Salvar produto</>
            }
          </button>
        </div>
      </div>

    </div>
  )
}
