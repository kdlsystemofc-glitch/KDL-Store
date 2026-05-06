'use client'
import Link from 'next/link'
import { ChevronRight, Crown, Check } from 'lucide-react'

const sections = [
  { href: '/configuracoes/empresa',    emoji: '🏪', title: 'Dados da Empresa',       desc: 'Nome, logo, CNPJ, telefone e endereço' },
  { href: '/configuracoes/usuarios',   emoji: '👥', title: 'Usuários e Acessos',      desc: 'Gerenciar vendedores e técnicos com permissões' },
  { href: '/configuracoes/pagamentos', emoji: '💳', title: 'Formas de Pagamento',     desc: 'PIX, Dinheiro, Crédito, Débito, Fiado' },
  { href: '/configuracoes/categorias', emoji: '🏷️', title: 'Categorias de Produtos', desc: 'Criar e organizar categorias' },
  { href: '/catalogo',                 emoji: '🌐', title: 'Catálogo Online',         desc: 'Configurar e visualizar seu catálogo público' },
]

const planFeatures = ['PDV ilimitado', 'Controle de estoque', 'Emissão de garantias', 'Ordens de serviço', 'Módulo Financeiro', 'CRM de Sumição', 'Comissões']

export default function ConfiguracoesPage() {
  function confirmarAcao(msg: string, cb: ()=>void) {
    if (window.confirm(`${msg}\n\nTem certeza? Isso não pode ser desfeito.`)) cb()
  }
  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: '680px' }}>

      <div>
        <h1 className="pg-titulo">⚙️ Configurações</h1>
        <p className="pg-sub">Gerencie sua conta, usuários e preferências</p>
      </div>

      {/* Plano */}
      <div style={{
        borderRadius: '8px', padding: '1.25rem', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #14532d, var(--verde))',
        border: '2px solid var(--verde-esc)'
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', transform: 'translate(30%,-30%)' }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <Crown size={18} style={{ color: '#fbbf24' }} fill="currentColor" />
              <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plano Atual</span>
            </div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>Essencial</h2>
            <p style={{ color: '#86efac', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Renova em 05/06/2026 · <strong style={{ color: '#fff' }}>R$ 39/mês</strong>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.625rem' }}>
              {planFeatures.map(f => (
                <span key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', fontWeight: 600, color: '#dcfce7' }}>
                  <Check size={11} /> {f}
                </span>
              ))}
            </div>
          </div>
          <Link href="/configuracoes/planos"
            className="btn"
            style={{ background: '#fff', color: 'var(--verde-esc)', border: 'none', fontWeight: 800, flexShrink: 0, gap: '0.375rem' }}>
            <Crown size={14} fill="currentColor" /> Upgrade
          </Link>
        </div>
      </div>

      {/* Seções */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {sections.map(s => (
          <Link key={s.href} href={s.href} className="card-click" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.375rem', background: 'var(--verde-claro)',
              border: '1px solid var(--verde-borda)', flexShrink: 0
            }}>
              {s.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, color: 'var(--texto)' }}>{s.title}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--texto-desab)', marginTop: '1px' }}>{s.desc}</p>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--texto-desab)', flexShrink: 0 }} />
          </Link>
        ))}
      </div>

      {/* Zona de perigo */}
      <div className="card" style={{ border: '1px solid #fca5a5' }}>
        <p style={{ fontWeight: 800, color: 'var(--vermelho)', marginBottom: '0.25rem' }}>⚠️ Zona de Perigo</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--texto-desab)', marginBottom: '0.875rem' }}>Ações irreversíveis. Tome cuidado.</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-danger"
            onClick={()=>confirmarAcao('Limpar todos os dados de teste?', ()=>alert('Dados limpos!'))}>
            🗑 Limpar dados de teste
          </button>
          <button className="btn btn-danger"
            onClick={()=>confirmarAcao('Encerrar sua conta permanentemente?', ()=>alert('Conta encerrada.'))}>
            ✕ Encerrar conta
          </button>
        </div>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)', textAlign: 'center', marginTop: '0.5rem' }}>
        NexoCommerce v1.2.0 · Feito para o pequeno comércio brasileiro 🇧🇷
      </p>
    </div>
  )
}
