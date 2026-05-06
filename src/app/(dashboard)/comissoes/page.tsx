'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Save, X } from 'lucide-react'

type Comissao = { id: string; nome: string; telefone: string; tipo: string; comissao: number; vendasMes: number; valorVendasMes: number; comissaoMes: number; pago: boolean }

const inicial: Comissao[] = [
  { id: '1', nome: 'Carlos Peixoto', telefone: '(11) 98765-0001', tipo: 'percentual', comissao: 3, vendasMes: 12, valorVendasMes: 11400, comissaoMes: 342, pago: false },
  { id: '2', nome: 'Dona Marlene',   telefone: '(11) 98765-0002', tipo: 'fixo',       comissao: 20, vendasMes: 8,  valorVendasMes: 6800,  comissaoMes: 160, pago: true },
  { id: '3', nome: 'Seu Zé',         telefone: '(11) 98765-0003', tipo: 'percentual', comissao: 2, vendasMes: 5,  valorVendasMes: 3200,  comissaoMes: 64,  pago: false },
]

export default function ComissoesPage() {
  const [lista,  setLista]  = useState<Comissao[]>(inicial)
  const [modal,  setModal]  = useState(false)
  const [nome,   setNome]   = useState('')
  const [tel,    setTel]    = useState('')
  const [tipo,   setTipo]   = useState('percentual')
  const [taxa,   setTaxa]   = useState('')

  const totalAPagar = lista.filter(p=>!p.pago).reduce((a,p)=>a+p.comissaoMes,0)
  const totalPago   = lista.filter(p=>p.pago ).reduce((a,p)=>a+p.comissaoMes,0)

  function salvarNovo() {
    if (!nome || !tel || !taxa) return
    const t = parseFloat(taxa)
    const novo: Comissao = {
      id: String(Date.now()), nome, telefone: tel, tipo,
      comissao: t, vendasMes: 0, valorVendasMes: 0, comissaoMes: 0, pago: false
    }
    setLista(prev => [...prev, novo])
    setModal(false); setNome(''); setTel(''); setTaxa('')
  }

  function marcarPago(id: string) {
    setLista(prev => prev.map(p => p.id === id ? {...p, pago: true} : p))
  }

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>

      {/* Modal cadastro */}
      {modal && (
        <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center' }}
          onClick={e=>{ if(e.target===e.currentTarget) setModal(false) }}>
          <div className="card anim-pop" style={{ width:'100%',maxWidth:'420px',padding:'1.25rem' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
              <p style={{ fontWeight:900,fontSize:'1rem' }}>+ Cadastrar Comissionado</p>
              <button onClick={()=>setModal(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--texto-desab)' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:'0.625rem' }}>
              <div><label className="campo-label">Nome *</label><input className="campo" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Carlos Peixoto"/></div>
              <div><label className="campo-label">Telefone / WhatsApp *</label><input className="campo" value={tel} onChange={e=>setTel(e.target.value)} placeholder="(11) 99999-0000"/></div>
              <div>
                <label className="campo-label">Tipo de comissão</label>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.375rem',marginTop:'0.25rem' }}>
                  <button onClick={()=>setTipo('percentual')} type="button"
                    style={{ padding:'0.5rem',border:`2px solid ${tipo==='percentual'?'var(--verde)':'var(--borda)'}`,borderRadius:'var(--radius-sm)',background:tipo==='percentual'?'var(--verde-claro)':'var(--surface)',cursor:'pointer',fontWeight:700,fontSize:'0.8rem',fontFamily:'inherit',color:tipo==='percentual'?'var(--verde-esc)':'var(--texto-sec)' }}>
                    % Percentual
                  </button>
                  <button onClick={()=>setTipo('fixo')} type="button"
                    style={{ padding:'0.5rem',border:`2px solid ${tipo==='fixo'?'var(--verde)':'var(--borda)'}`,borderRadius:'var(--radius-sm)',background:tipo==='fixo'?'var(--verde-claro)':'var(--surface)',cursor:'pointer',fontWeight:700,fontSize:'0.8rem',fontFamily:'inherit',color:tipo==='fixo'?'var(--verde-esc)':'var(--texto-sec)' }}>
                    R$ Fixo/venda
                  </button>
                </div>
              </div>
              <div><label className="campo-label">{tipo==='percentual'?'Percentual (%)':'Valor fixo por venda (R$)'} *</label>
                <input className="campo" type="number" min="0" step="0.01" value={taxa} onChange={e=>setTaxa(e.target.value)} placeholder={tipo==='percentual'?'Ex: 3':'Ex: 20,00'}/>
              </div>
            </div>
            <div style={{ display:'flex',gap:'0.5rem',marginTop:'1rem',justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={salvarNovo} className="btn btn-primary" id="btn-salvar-comissao" disabled={!nome||!tel||!taxa}>
                <Save size={14}/> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">🎯 Comissões</h1>
          <p className="pg-sub">Gestão de comissionados de indicação — exclusivo NexoCommerce</p>
        </div>
        <button id="btn-cadastrar-comissao" className="btn btn-primary" onClick={()=>setModal(true)}>+ Cadastrar Comissionado</button>
      </div>

      <div className="alerta alerta-info">
        <span>💡</span>
        <span>Comissionados são pessoas que indicam clientes para a sua loja e recebem comissão por venda. Defina se é <strong>% do valor</strong> ou <strong>valor fixo por venda</strong>.</span>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'0.625rem' }}>
        <div className="kpi-card" style={{ borderLeft:'4px solid var(--verde)' }}>
          <p className="kpi-label">Ativos</p>
          <p className="kpi-valor">{lista.length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Vendas via Comissão (mês)</p>
          <p className="kpi-valor">{lista.reduce((a,p)=>a+p.vendasMes,0)}</p>
        </div>
        <div className="kpi-card" style={{ borderLeft:'4px solid var(--vermelho)' }}>
          <p className="kpi-label">A Pagar este Mês</p>
          <p className="kpi-valor" style={{ color:'var(--vermelho)', fontSize:'1.5rem' }}>{formatCurrency(totalAPagar)}</p>
        </div>
        <div className="kpi-card" style={{ borderLeft:'4px solid var(--azul)' }}>
          <p className="kpi-label">Já Pago este Mês</p>
          <p className="kpi-valor" style={{ color:'var(--azul)', fontSize:'1.5rem' }}>{formatCurrency(totalPago)}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Comissionado</th><th>Telefone</th><th>Tipo</th>
              <th style={{ textAlign:'right' }}>Taxa</th>
              <th style={{ textAlign:'right' }}>Vendas</th>
              <th style={{ textAlign:'right' }}>Valor Vendas</th>
              <th style={{ textAlign:'right' }}>Comissão</th>
              <th>Situação</th>
              <th style={{ textAlign:'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight:700 }}>{p.nome}</td>
                <td style={{ fontSize:'0.82rem', color:'var(--texto-sec)' }}>{p.telefone}</td>
                <td><span className={p.tipo==='percentual'?'status-info':'status-neutro'} style={{ fontSize:'0.8rem' }}>● {p.tipo==='percentual'?'Percentual':'Valor Fixo'}</span></td>
                <td style={{ textAlign:'right', fontWeight:700 }}>{p.tipo==='percentual'?`${p.comissao}%`:formatCurrency(p.comissao)+'/venda'}</td>
                <td style={{ textAlign:'right', fontWeight:700 }}>{p.vendasMes}</td>
                <td style={{ textAlign:'right', fontWeight:700, color:'var(--verde)', fontFamily:'monospace' }}>{formatCurrency(p.valorVendasMes)}</td>
                <td style={{ textAlign:'right', fontWeight:900, fontFamily:'monospace', fontSize:'0.95rem', color:p.pago?'var(--texto-desab)':'var(--vermelho)' }}>{formatCurrency(p.comissaoMes)}</td>
                <td><span className={p.pago?'status-ok':'status-erro'} style={{ fontSize:'0.82rem' }}>{p.pago?'● Pago':'● Pendente'}</span></td>
                <td style={{ textAlign:'center' }}>
                  <div style={{ display:'flex', gap:'0.25rem', justifyContent:'center' }}>
                    <a href={`https://wa.me/55${p.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                      className="btn btn-secondary" style={{ fontSize:'0.7rem', padding:'0.25rem 0.5rem' }}>💬 WhatsApp</a>
                    {!p.pago && (
                      <button onClick={()=>marcarPago(p.id)} className="btn btn-primary" style={{ fontSize:'0.7rem', padding:'0.25rem 0.5rem' }}>✓ Marcar Pago</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ranking */}
      <div className="card">
        <p style={{ fontWeight:800, marginBottom:'0.875rem' }}>🏆 Ranking do Mês</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {[...lista].sort((a,b)=>b.valorVendasMes-a.valorVendasMes).map((p,i)=>(
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem', background:'var(--surface-alt)', borderRadius:'var(--radius-sm)', border:'1px solid var(--borda-leve)' }}>
              <span style={{ fontWeight:900, fontSize:'1.25rem', width:'28px', textAlign:'center' }}>
                {i===0?'🥇':i===1?'🥈':'🥉'}
              </span>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700 }}>{p.nome}</p>
                <p style={{ fontSize:'0.75rem', color:'var(--texto-desab)' }}>{p.vendasMes} vendas</p>
              </div>
              <span style={{ fontWeight:900, color:'var(--verde)', fontFamily:'monospace' }}>{formatCurrency(p.valorVendasMes)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
