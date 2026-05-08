'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Plus, Search, Loader2, X } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { FormFornecedor } from '@/components/FormFornecedor'

type Fornecedor = {
  id: string; nome: string; contato: string | null; telefone: string | null
  categoria: string | null; cidade: string | null; prazo_entrega: string | null; ativo: boolean
}
type Pedido = {
  id: string; produto: string; quantidade: number
  status: string; criado_em: string
  fornecedores: { nome: string }[] | null
}

export default function FornecedoresPage() {
  const { empresaId } = useEmpresaId()
  const [aba,         setAba]         = useState<'lista'|'pedidos'>('lista')
  const [fornecedores,setFornecedores] = useState<Fornecedor[]>([])
  const [pedidos,     setPedidos]     = useState<Pedido[]>([])
  const [busca,       setBusca]       = useState('')
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const [{ data: forn }, { data: peds }] = await Promise.all([
      supabase.from('fornecedores').select('id,nome,contato,telefone,categoria,cidade,prazo_entrega,ativo').eq('empresa_id', eid).order('nome'),
      supabase.from('pedidos_fornecedor').select('id,produto,quantidade,status,criado_em,fornecedores(nome)').eq('empresa_id', eid).order('criado_em', { ascending: false }),
    ])
    setFornecedores(forn || [])
    setPedidos(peds || [])
    setLoading(false)
  }

  async function avancarStatus(id: string, atual: string) {
    const next = atual === 'aguardando' ? 'confirmado' : 'entregue'
    const supabase = createClient()
    await supabase.from('pedidos_fornecedor').update({ status: next }).eq('id', id)
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: next } : p))
  }

  const filtrados = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (f.categoria || '').toLowerCase().includes(busca.toLowerCase())
  )

  const pendentes = pedidos.filter(p => p.status !== 'entregue').length

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">🏭 Fornecedores</h1>
          <p className="pg-sub">{fornecedores.length} fornecedores · {pendentes} pedido(s) pendente(s)</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
          <Plus size={15}/> Novo Fornecedor
        </button>
      </div>

      <PageTabs tabs={[
        { label: 'Todos os Clientes', href: '/clientes' },
        { label: 'Sumidos ⚠', href: '/clientes/inativos' },
        { label: 'Fornecedores', href: '/fornecedores' }
      ]} />

      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div className="card anim-pop" style={{ width:'100%', maxWidth:'680px', maxHeight:'90vh', overflowY:'auto', padding:'0' }}>
            <div style={{ padding:'1.25rem', borderBottom:'1px solid var(--borda)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--surface)', zIndex:10 }}>
              <div>
                <h2 style={{ fontSize:'1.25rem', fontWeight:800 }}>🏭 Cadastrar Novo Fornecedor</h2>
                <p style={{ fontSize:'0.85rem', color:'var(--texto-desab)' }}>Preencha os dados do fornecedor</p>
              </div>
              <button onClick={()=>setShowModal(false)} className="btn-icon"><X size={20}/></button>
            </div>
            <div style={{ padding:'1.25rem' }}>
              <FormFornecedor onSuccess={() => { setShowModal(false); if (empresaId) carregar(empresaId); }} onCancel={() => setShowModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Abas */}
      <div style={{ display:'flex', gap:'0.25rem', background:'var(--surface)', border:'1px solid var(--borda)', borderRadius:'var(--radius)', padding:'0.25rem', width:'fit-content' }}>
        {([['lista','📋 Fornecedores'],['pedidos',`📦 Pedidos Pendentes${pendentes>0?' ('+pendentes+')':''}`]] as const).map(([v,l])=>(
          <button key={v} onClick={()=>setAba(v)}
            className={aba===v?'btn btn-primary':'btn btn-ghost'}
            style={{ fontSize:'0.82rem', padding:'0.3rem 0.75rem' }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'3rem', gap:'0.75rem', color:'var(--texto-desab)' }}>
          <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }}/> Carregando...
        </div>
      ) : aba === 'lista' ? (
        <>
          <div style={{ position:'relative', maxWidth:'360px' }}>
            <Search size={14} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--texto-desab)' }}/>
            <input className="campo" placeholder="Buscar fornecedor..."
              style={{ paddingLeft:'2.25rem' }} value={busca} onChange={e=>setBusca(e.target.value)}/>
          </div>
          {filtrados.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--texto-desab)' }}>
              {busca ? 'Nenhum fornecedor encontrado.' : (
                <div>
                  <p style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🏭</p>
                  <p style={{ fontWeight:700, marginBottom:'0.25rem' }}>Nenhum fornecedor cadastrado</p>
                  <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ marginTop:'0.5rem', display:'inline-flex' }}>+ Cadastrar fornecedor</button>
                </div>
              )}
            </div>
          ) : (
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr style={{ background:'#364a60' }}>
                    <th>Fornecedor</th><th>Contato</th><th>Categoria</th>
                    <th>Cidade</th><th>Prazo</th><th style={{ textAlign:'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontWeight:700 }}>{f.nome}</td>
                      <td>
                        {f.telefone
                          ? <a href={`https://wa.me/55${f.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                              className="btn btn-secondary" style={{ fontSize:'0.75rem', padding:'0.2rem 0.5rem' }}>
                              💬 {f.contato || f.telefone}
                            </a>
                          : <span style={{ color:'var(--texto-desab)' }}>{f.contato || '—'}</span>
                        }
                      </td>
                      <td style={{ fontSize:'0.82rem' }}>{f.categoria || '—'}</td>
                      <td style={{ fontSize:'0.82rem' }}>{f.cidade || '—'}</td>
                      <td style={{ fontSize:'0.82rem' }}>{f.prazo_entrega || '—'}</td>
                      <td style={{ textAlign:'center' }}>
                        <span className={f.ativo?'status-ok':'status-neutro'} style={{ fontSize:'0.78rem' }}>
                          {f.ativo?'● Ativo':'○ Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{ background:'#364a60' }}>
                <th>Produto</th><th>Fornecedor</th><th style={{ textAlign:'center' }}>Qtd</th>
                <th>Data</th><th style={{ textAlign:'center' }}>Status</th><th style={{ textAlign:'center' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'var(--texto-desab)' }}>
                  Nenhum pedido pendente
                </td></tr>
              ) : pedidos.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight:700 }}>{p.produto}</td>
                  <td style={{ fontSize:'0.85rem' }}>{Array.isArray(p.fornecedores) ? p.fornecedores[0]?.nome : '—'}</td>
                  <td style={{ textAlign:'center', fontWeight:800 }}>{p.quantidade}x</td>
                  <td style={{ fontSize:'0.82rem' }}>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td style={{ textAlign:'center' }}>
                    <span className={p.status==='entregue'?'status-ok':p.status==='confirmado'?'status-aviso':'status-neutro'}
                      style={{ fontSize:'0.78rem', textTransform:'capitalize' }}>
                      {p.status==='aguardando'?'⏳ Aguardando':p.status==='confirmado'?'✓ Confirmado':'✅ Entregue'}
                    </span>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    {p.status !== 'entregue' && (
                      <button onClick={()=>avancarStatus(p.id, p.status)}
                        className="btn btn-secondary" style={{ fontSize:'0.72rem', padding:'0.2rem 0.5rem' }}>
                        {p.status==='aguardando'?'✓ Confirmar':'✅ Entregue'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
