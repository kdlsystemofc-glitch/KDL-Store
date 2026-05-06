'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

const fornecedores = [
  { id: '1', nome: 'JBL Distribuidora SP', contato: 'Sandro',  telefone: '(11) 99999-0001', categoria: 'Eletrônicos', cidade: 'São Paulo',   prazo: '24h', pedidoMin: 'R$ 500', status: 'ativo' },
  { id: '2', nome: 'Auto Peças Central',   contato: 'Marcão',  telefone: '(11) 99999-0002', categoria: 'Acessórios',  cidade: 'Santo André',  prazo: '48h', pedidoMin: 'R$ 200', status: 'ativo' },
  { id: '3', nome: 'Taramps Distribuidora',contato: 'Fábio',   telefone: '(11) 99999-0003', categoria: 'Eletrônicos', cidade: 'São Paulo',   prazo: '72h', pedidoMin: 'R$ 800', status: 'ativo' },
  { id: '4', nome: 'Acessórios Brasil',    contato: 'Cláudia', telefone: '(11) 99999-0004', categoria: 'Acessórios',  cidade: 'Osasco',       prazo: '48h', pedidoMin: 'R$ 150', status: 'inativo' },
]

const mockPedidos = [
  { id: '1', produto: 'Som JBL Stage 200',     fornecedor: 'JBL Distribuidora SP', qty: 3,  data: '05/05/2026', status: 'aguardando' },
  { id: '2', produto: 'Cabo RCA 5m',           fornecedor: 'Auto Peças Central',   qty: 10, data: '04/05/2026', status: 'confirmado' },
]

export default function FornecedoresPage() {
  const [aba, setAba]         = useState<'lista'|'pedidos'>('lista')
  const [pedidos, setPedidos] = useState(mockPedidos)

  function avancarStatus(id: string) {
    setPedidos(prev => prev.map(p => {
      if (p.id !== id) return p
      const next = p.status === 'aguardando' ? 'confirmado' : 'entregue'
      return { ...p, status: next }
    }))
  }

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">🚚 Fornecedores</h1>
          <p className="pg-sub">{fornecedores.length} fornecedores cadastrados</p>
        </div>
        <Link href="/fornecedores/novo" className="btn btn-primary">+ Novo Fornecedor</Link>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--borda)' }}>
        {(['lista','pedidos'] as const).map((t, i) => (
          <button key={t} onClick={() => setAba(t)} style={{
            padding: '0.5rem 1rem', background: aba===t ? 'var(--surface)' : 'transparent',
            border: aba===t ? '1px solid var(--borda)' : 'none',
            borderBottom: aba===t ? '2px solid var(--surface)' : 'none',
            fontWeight: aba===t ? 800 : 600, cursor: 'pointer', fontFamily: 'inherit',
            color: aba===t ? 'var(--verde)' : 'var(--texto-sec)', fontSize: '0.875rem',
            marginBottom: aba===t ? '-2px' : 0, borderRadius: '5px 5px 0 0',
          }}>
            {t === 'lista' ? 'Fornecedores' : <>Pedidos Pendentes {pedidos.filter(p=>p.status!=='entregue').length > 0 && <span style={{ background:'var(--vermelho)',color:'#fff',borderRadius:'10px',padding:'0 5px',fontSize:'0.7rem',fontWeight:900,marginLeft:'4px' }}>{pedidos.filter(p=>p.status!=='entregue').length}</span>}</>}
          </button>
        ))}
      </div>

      {aba === 'lista' && (<>
        {/* Filtros */}
        <div className="card" style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-desab)' }} />
            <input className="campo" style={{ paddingLeft: '1.75rem' }} placeholder="Buscar fornecedor..." />
          </div>
          <select className="campo" style={{ width: 'auto' }}>
            <option>Todas categorias</option><option>Eletrônicos</option><option>Acessórios</option>
          </select>
        </div>

        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Fornecedor</th><th>Contato</th><th>Telefone</th>
                <th>Categoria</th><th>Cidade</th><th>Prazo Entrega</th>
                <th>Pedido Mínimo</th><th>Status</th>
                <th style={{ textAlign:'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map(f => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 700 }}>{f.nome}</td>
                  <td style={{ color:'var(--texto-sec)' }}>{f.contato}</td>
                  <td style={{ fontSize:'0.82rem' }}>{f.telefone}</td>
                  <td><span className="tag tag-azul">{f.categoria}</span></td>
                  <td style={{ fontSize:'0.82rem', color:'var(--texto-sec)' }}>{f.cidade}</td>
                  <td style={{ fontWeight: 600 }}>{f.prazo}</td>
                  <td style={{ fontWeight: 600 }}>{f.pedidoMin}</td>
                  <td><span className={f.status === 'ativo' ? 'status-ok' : 'status-neutro'} style={{ fontSize:'0.82rem' }}>{f.status === 'ativo' ? '● Ativo' : '● Inativo'}</span></td>
                  <td style={{ textAlign:'center' }}>
                    <div style={{ display:'flex', gap:'0.25rem', justifyContent:'center' }}>
                      <a href={`https://wa.me/55${f.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                        className="btn btn-primary" style={{ fontSize:'0.7rem', padding:'0.25rem 0.625rem', background:'#25D366', border:'none' }}>
                        💬 WhatsApp
                      </a>
                      <button className="btn btn-secondary" style={{ fontSize:'0.7rem', padding:'0.25rem 0.5rem' }}>✏</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}

      {aba === 'pedidos' && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Produto</th><th>Fornecedor</th><th style={{textAlign:'center'}}>Qtd</th>
                <th>Data</th><th>Status</th><th style={{textAlign:'center'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700 }}>{p.produto}</td>
                  <td style={{ color: 'var(--texto-sec)' }}>{p.fornecedor}</td>
                  <td style={{ textAlign:'center', fontWeight: 700 }}>{p.qty}x</td>
                  <td style={{ fontSize:'0.82rem', color:'var(--texto-desab)' }}>{p.data}</td>
                  <td>
                    <span className={p.status==='aguardando'?'status-alerta':p.status==='confirmado'?'status-info':'status-ok'} style={{ fontSize:'0.82rem' }}>
                      {p.status==='aguardando'?'● Aguardando':p.status==='confirmado'?'● Confirmado':'● Entregue'}
                    </span>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    {p.status !== 'entregue' && (
                      <button onClick={() => avancarStatus(p.id)} className="btn btn-primary" style={{ fontSize:'0.7rem', padding:'0.25rem 0.5rem' }}>
                        {p.status === 'aguardando' ? '✓ Confirmar' : '✓ Entregue'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {pedidos.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'var(--texto-desab)' }}>Nenhum pedido pendente</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
