'use client'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Plus, Search, Loader2, X } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { FormCliente } from '@/components/FormCliente'
import { useSubscription } from '@/hooks/useSubscription'

type Cliente = {
  id: string; nome: string; telefone: string | null; tipo: string
  ultima_compra: string | null; ativo: boolean
}

export default function ClientesPage() {
  const { empresaId } = useEmpresaId()
  const { plano } = useSubscription()
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
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">CLIENTES</h1>
          <p className="pg-sub">{ativos} ATIVOS · {inativos} SUMIDOS</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + NOVO CLIENTE
        </button>
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div className="anim-pop" style={{ width:'100%', maxWidth:'580px', maxHeight:'90vh', overflowY:'auto', background:'var(--surface)', border:'1px solid var(--borda-forte)', borderRadius:'2px' }}>
            <div style={{ padding:'0.75rem 1rem', borderBottom:'2px solid var(--verde)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--fundo-painel)', zIndex:10 }}>
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--verde)', textTransform:'uppercase', letterSpacing:'0.06em' }}>CADASTRAR NOVO CLIENTE</p>
                <p style={{ fontSize:'0.65rem', color:'var(--texto-desab)' }}>Preencha os dados do cliente</p>
              </div>
              <button onClick={()=>setShowModal(false)} className="btn-icon"><X size={16}/></button>
            </div>
            <div style={{ padding:'1rem' }}>
              <FormCliente onSuccess={() => { toast.success('Salvo com sucesso!'); setShowModal(false); if (empresaId) carregar(empresaId); }} onCancel={() => setShowModal(false)} />
            </div>
          </div>
        </div>
      )}

      <PageTabs tabs={[
        { label: 'Todos os Clientes', href: '/clientes' },
        { label: plano === 'pro' ? 'Sumidos ⚠' : 'Sumidos 🔒', href: '/clientes/inativos' },
        { label: 'Fornecedores', href: '/fornecedores' }
      ]} />

      {/* Filtros + Busca */}
      <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap', alignItems:'center' }}>
        {([
          { v:'todos',    l:'TODOS' },
          { v:'varejo',   l:'VAREJO' },
          { v:'atacado',  l:'ATACADO' },
          { v:'vip',      l:'★ VIP' },
          { v:'inativos', l:'⚠ SUMIDOS' },
        ] as const).map(f => (
          <button key={f.v} onClick={() => setFiltro(f.v)}
            className={filtro === f.v ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize:'0.65rem', padding:'0.3rem 0.625rem' }}>
            {f.l}
          </button>
        ))}
        <input className="campo" placeholder="BUSCAR POR NOME OU TELEFONE_"
          style={{ flex:1, maxWidth:'280px' }}
          value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'3rem', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
          <p style={{ color:'var(--verde)', fontSize:'0.75rem', letterSpacing:'0.08em' }}>CARREGANDO CLIENTES<span className="blink">_</span></p>
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--texto-desab)', border:'1px solid var(--borda)', background:'var(--surface)' }}>
          {busca || filtro !== 'todos' ? (
            <p style={{ fontSize:'0.78rem', letterSpacing:'0.04em' }}>[ NENHUM CLIENTE ENCONTRADO ]</p>
          ) : (
            <div>
              <p style={{ fontSize:'0.7rem', color:'var(--borda-forte)', letterSpacing:'0.1em', fontWeight:700, marginBottom:'0.5rem' }}>[ CADASTRO VAZIO ]</p>
              <p style={{ fontSize:'0.72rem', marginBottom:'1rem' }}>Cadastre seu primeiro cliente para começar</p>
              <button onClick={() => setShowModal(true)} className="btn btn-primary">+ CADASTRAR CLIENTE</button>
            </div>
          )}
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>NOME</th><th>TELEFONE/WA</th><th>TIPO</th>
                <th>ÚLT. COMPRA</th><th style={{ textAlign:'center' }}>STATUS</th>
                <th style={{ textAlign:'center' }}>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight:700 }}>{c.nome}</td>
                  <td>
                    {c.telefone
                      ? <a href={`https://wa.me/55${c.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                          className="btn btn-secondary" style={{ fontSize:'0.65rem', padding:'0.2rem 0.5rem' }}>
                          WA {c.telefone}
                        </a>
                      : <span style={{ color:'var(--texto-desab)' }}>—</span>
                    }
                  </td>
                  <td>
                    <span className={c.tipo==='vip'?'status-alerta':c.tipo==='atacado'?'status-aviso':'status-neutro'}
                      style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.04em' }}>
                      {c.tipo==='vip'?'★ VIP':c.tipo==='atacado'?'ATACADO':'VAREJO'}
                    </span>
                  </td>
                  <td style={{ fontSize:'0.75rem', color:'var(--texto-desab)', fontVariantNumeric:'tabular-nums' }}>
                    {c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <span className={c.ativo ? 'status-ok' : 'status-neutro'} style={{ fontSize:'0.7rem' }}>
                      {c.ativo ? '● ATIVO' : '○ SUMIDO'}
                    </span>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <Link href={`/clientes/${c.id}`} className="btn btn-secondary"
                      style={{ fontSize:'0.65rem', padding:'0.2rem 0.5rem' }}>VER</Link>
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
