'use client'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { ChevronRight, Crown, Check, Loader2, Save } from 'lucide-react'

const sections = [
  { href: '/configuracoes/empresa',    icon: '[EMP]', title: 'DADOS DA EMPRESA',       desc: 'Nome, logo, CNPJ, telefone e endereço' },
  { href: '/configuracoes/usuarios',   icon: '[USR]', title: 'USUÁRIOS E ACESSOS',      desc: 'Gerenciar vendedores e técnicos com permissões' },
  { href: '/configuracoes/pagamentos', icon: '[PAG]', title: 'FORMAS DE PAGAMENTO',     desc: 'PIX, Dinheiro, Crédito, Débito, Fiado' },
  { href: '/configuracoes/categorias', icon: '[CAT]', title: 'CATEGORIAS DE PRODUTOS',  desc: 'Criar e organizar categorias' },
  { href: '/catalogo',                 icon: '[WWW]', title: 'CATÁLOGO ONLINE',          desc: 'Configurar e visualizar seu catálogo público' },
]

const planFeatures = ['PDV ilimitado', 'Controle de estoque', 'Emissão de garantias', 'Ordens de serviço', 'Módulo Financeiro', 'CRM de Sumição', 'Comissões']

export default function ConfiguracoesPage() {
  const { empresaId } = useEmpresaId()
  const [prazoCrm, setPrazoCrm] = useState<number>(60)
  const [salvandoCrm, setSalvandoCrm] = useState(false)

  useEffect(() => {
    if (empresaId) {
      createClient().from('empresas').select('crm_prazo_inatividade_dias').eq('id', empresaId).single()
        .then(({data}) => { if (data?.crm_prazo_inatividade_dias) setPrazoCrm(data.crm_prazo_inatividade_dias) })
    }
  }, [empresaId])

  async function salvarPrazo() {
    if (!empresaId) return
    setSalvandoCrm(true)
    const val = Math.max(7, Math.min(365, Number(prazoCrm)))
    await createClient().from('empresas').update({ crm_prazo_inatividade_dias: val }).eq('id', empresaId)
    setPrazoCrm(val)
    setSalvandoCrm(false)
    toast.success('Configurações salvas!')
  }

  function confirmarAcao(msg: string, cb: ()=>void) {
    if (window.confirm(`${msg}\n\nTem certeza? Isso não pode ser desfeito.`)) cb()
  }
  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '680px' }}>

      <div>
        <h1 className="pg-titulo">CONFIGURAÇÕES</h1>
        <p className="pg-sub">CONTA · USUÁRIOS · PREFERÊNCIAS</p>
      </div>

      {/* Plano — estilo terminal */}
      <div style={{
        padding: '0.875rem 1rem', position: 'relative', overflow: 'hidden',
        background: 'var(--fundo-painel)',
        border: '1px solid var(--verde)',
        borderLeft: '4px solid var(--verde)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <span style={{ color: 'var(--amarelo)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>● PLANO ATUAL</span>
            </div>
            <p style={{ color: 'var(--verde)', fontWeight: 900, fontSize: '1.5rem', lineHeight: 1, letterSpacing: '0.06em' }}>ESSENCIAL</p>
            <p style={{ color: 'var(--texto-sec)', fontSize: '0.72rem', marginTop: '0.25rem', letterSpacing: '0.04em' }}>
              RENOVA EM 05/06/2026 · <span style={{ color: 'var(--verde)', fontWeight: 700 }}>R$ 39/MES</span>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', marginTop: '0.5rem' }}>
              {planFeatures.map(f => (
                <span key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--texto-sec)', letterSpacing: '0.04em' }}>
                  <Check size={10} style={{ color: 'var(--verde)' }} /> {f.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          <Link href="/configuracoes/planos"
            className="btn btn-primary"
            style={{ fontWeight: 800, flexShrink: 0, fontSize: '0.72rem' }}>
            <Crown size={13} fill="currentColor" /> UPGRADE
          </Link>
        </div>
      </div>

      {/* Seções */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header"><span>MENU DE CONFIGURAÇÕES</span></div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {sections.map((s, i) => (
            <Link key={s.href} href={s.href} style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.6rem 0.875rem',
              borderBottom: i < sections.length-1 ? '1px solid var(--borda-leve)' : 'none',
              textDecoration: 'none',
              transition: 'background 0.12s'
            }}
              onMouseEnter={e=>(e.currentTarget.style.background='var(--surface-alt)')}
              onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
            >
              <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'var(--verde)', fontWeight:700, flexShrink:0 }}>{s.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: 'var(--texto)', fontSize:'0.78rem', letterSpacing:'0.04em' }}>{s.title}</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--texto-desab)', marginTop: '1px' }}>{s.desc}</p>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--texto-desab)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Preferências do CRM */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header"><span>PREFERÊNCIAS DO CRM</span></div>
        <div style={{padding:'0.75rem'}}>
          <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)', marginBottom: '0.75rem', letterSpacing:'0.03em' }}>CONFIGURE QUANDO OS CLIENTES DEVEM SER CONSIDERADOS SUMIDOS.</p>
          <div style={{ display:'flex', gap:'0.5rem', alignItems:'flex-end' }}>
            <div style={{ flex: 1, maxWidth:'250px' }}>
              <label className="campo-label" style={{fontSize:'0.65rem'}}>ALERTAR CLIENTES INATIVOS APÓS (DIAS)</label>
              <input type="number" min={7} max={365} className="campo" style={{marginTop:'0.375rem',fontSize:'0.78rem'}} value={prazoCrm} onChange={e=>setPrazoCrm(Number(e.target.value))} />
            </div>
            <button onClick={salvarPrazo} disabled={salvandoCrm} className="btn btn-primary" style={{height:'36px',fontSize:'0.72rem'}}>
              {salvandoCrm ? 'SALVANDO...' : '▶ SALVAR'}
            </button>
          </div>
        </div>
      </div>

    // Zona de perigo removida (recurso em desenvolvimento)

      <p style={{ fontSize: '0.65rem', color: 'var(--texto-desab)', textAlign: 'center', marginTop: '0.5rem', letterSpacing:'0.06em' }}>
        NEXOCOMMERCE v1.2.0 · FEITO PARA O PEQUENO COMÉRCIO BRASILEIRO
      </p>
    </div>
  )
}
