'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Plus, Search, Loader2, X } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { FormCliente } from '@/components/FormCliente'

type Cliente = {
  id: string; nome: string; telefone: string | null; tipo: string
  ultima_compra: string | null; ativo: boolean
}

export default function ClientesPage() {
  const { empresaId } = useEmpresaId()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca,    setBusca]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [filtro,   setFiltro]   = useState<'todos'|'varejo'|'atacado'|'vip'|'inativos'>('todos')
  const [showModal,setShowModal] = useState(false)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient()
      .from('clientes')
      .select('id,nome,telefone,tipo,ultima_compra,ativo')
      .eq('empresa_id', eid)
      .order('nome')
    setClientes(data || [])
    setLoading(false)
  }

  const filtrados = clientes.filter(c => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.telefone || '').includes(busca)
    const matchFiltro = filtro === 'todos' ? true
      : filtro === 'inativos' ? !c.ativo
      : c.tipo === filtro && c.ativo
    return matchBusca && matchFiltro
  })

  const ativos   = clientes.filter(c => c.ativo).length
  const inativos = clientes.filter(c => !c.ativo).length

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">👥 Clientes</h1>
          <p className="pg-sub">{ativos} ativos · {inativos} sumidos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
          <Plus size={15}/> Novo Cliente
        </button>
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div className="card anim-pop" style={{ width:'100%', maxWidth:'600px', maxHeight:'90vh', overflowY:'auto', padding:'0' }}>
            <div style={{ padding:'1.25rem', borderBottom:'1px solid var(--borda)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--surface)', zIndex:10 }}>
              <div>
                <h2 style={{ fontSize:'1.25rem', fontWeight:800 }}>👤 Cadastrar Novo Cliente</h2>
                <p style={{ fontSize:'0.85rem', color:'var(--texto-desab)' }}>Preencha os dados do cliente</p>
              </div>
              <button onClick={()=>setShowModal(false)} className="btn-icon"><X size={20}/></button>
            </div>
            <div style={{ padding:'1.25rem' }}>
              <FormCliente onSuccess={() => { setShowModal(false); if (empresaId) carregar(empresaId); }} onCancel={() => setShowModal(false)} />
            </div>
          </div>
        </div>
      )}

      <PageTabs tabs={[
        { label: 'Todos os Clientes', href: '/clientes' },
        { label: 'Sumidos ⚠', href: '/clientes/inativos' },
        { label: 'Fornecedores', href: '/fornecedores' }
      ]} />

      {/* Filtros */}
      <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
        {([
          { v:'todos',    l:'Todos' },
          { v:'varejo',   l:'Varejo' },
          { v:'atacado',  l:'Atacado' },
          { v:'vip',      l:'VIP ⭐' },
          { v:'inativos', l:'Sumidos' },
        ] as const).map(f => (
          <button key={f.v} onClick={() => setFiltro(f.v)}
            className={filtro === f.v ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize:'0.8rem', padding:'0.3rem 0.75rem' }}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div style={{ position:'relative', maxWidth:'360px' }}>
        <Search size={14} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--texto-desab)' }}/>
        <input className="campo" placeholder="Buscar por nome ou telefone..."
          style={{ paddingLeft:'2.25rem' }}
          value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'3rem', gap:'0.75rem', color:'var(--texto-desab)' }}>
          <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }}/> Carregando...
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--texto-desab)' }}>
          {busca || filtro !== 'todos' ? 'Nenhum cliente encontrado.' : (
            <div>
              <p style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>👥</p>
              <p style={{ fontWeight:700, marginBottom:'0.25rem' }}>Nenhum cliente cadastrado ainda</p>
              <p style={{ fontSize:'0.85rem', marginBottom:'1rem' }}>Cadastre seu primeiro cliente</p>
              <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Cadastrar cliente</button>
            </div>
          )}
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{ background:'#364a60' }}>
                <th>Nome</th><th>Telefone</th><th>Tipo</th>
                <th>Última compra</th><th style={{ textAlign:'center' }}>Status</th>
                <th style={{ textAlign:'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight:700 }}>{c.nome}</td>
                  <td>
                    {c.telefone
                      ? <a href={`https://wa.me/55${c.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                          className="btn btn-secondary" style={{ fontSize:'0.75rem', padding:'0.2rem 0.5rem' }}>
                          💬 {c.telefone}
                        </a>
                      : <span style={{ color:'var(--texto-desab)' }}>—</span>
                    }
                  </td>
                  <td>
                    <span className={c.tipo === 'vip' ? 'status-alerta' : c.tipo === 'atacado' ? 'status-aviso' : 'status-neutro'}
                      style={{ fontSize:'0.78rem' }}>
                      {c.tipo === 'vip' ? '⭐ VIP' : c.tipo === 'atacado' ? '📦 Atacado' : '🛒 Varejo'}
                    </span>
                  </td>
                  <td style={{ fontSize:'0.82rem', color:'var(--texto-desab)' }}>
                    {c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <span className={c.ativo ? 'status-ok' : 'status-neutro'} style={{ fontSize:'0.78rem' }}>
                      {c.ativo ? '● Ativo' : '○ Sumido'}
                    </span>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <Link href={`/clientes/${c.id}`} className="btn btn-secondary"
                      style={{ fontSize:'0.75rem', padding:'0.25rem 0.625rem' }}>Ver</Link>
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
