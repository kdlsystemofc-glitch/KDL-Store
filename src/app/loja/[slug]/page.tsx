import { createClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import Image from 'next/image'

// Forçamos a revalidação constante ou podemos deixar dinâmico
export const revalidate = 60 // 1 min cache

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const supabaseAdmin = getAdminClient()
  if (!supabaseAdmin) return { title: 'Loja não encontrada' }
  const { data: empresa } = await supabaseAdmin.from('empresas').select('nome').eq('slug', resolvedParams.slug).single()
  return {
    title: empresa ? `Catálogo - ${empresa.nome}` : 'Loja não encontrada',
    description: empresa ? `Confira o catálogo de produtos de ${empresa.nome}` : ''
  }
}

export default async function LojaPublicaPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const { slug } = resolvedParams

  if (!slug) return notFound()

  const supabaseAdmin = getAdminClient()
  if (!supabaseAdmin) return notFound()

  // Busca a empresa
  const { data: empresa } = await supabaseAdmin
    .from('empresas')
    .select('id, nome, telefone, whatsapp, instagram, cidade')
    .eq('slug', slug)
    .single()

  if (!empresa) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Loja não encontrada 😕</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Verifique se o link está correto.</p>
        </div>
      </div>
    )
  }

  // Busca produtos ativos no catálogo (com RLS isso funcionaria via anon key, mas como estamos no server e temos a service_role, usamos ela para garantir, ou anon key)
  const { data: produtos } = await supabaseAdmin
    .from('produtos')
    .select('id, nome, descricao, preco_catalogo, preco_varejo, preco_atacado, preco_vip, destaque, imagem_url')
    .eq('empresa_id', empresa.id)
    .eq('ativo', true)
    .eq('ativo_catalogo', true)
    .order('destaque', { ascending: false, nullsFirst: false })
    .order('nome')

  const prods = produtos || []
  
  const whatsappNumber = empresa.whatsapp || empresa.telefone?.replace(/\D/g, '') || ''
  const hasWhatsapp = !!whatsappNumber

  function getPreco(p: any) {
    const tipo = p.preco_catalogo || 'varejo'
    if (tipo === 'ocultar') return null
    if (tipo === 'atacado') return p.preco_atacado || p.preco_varejo
    if (tipo === 'vip')     return p.preco_vip || p.preco_varejo
    return p.preco_varejo
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Nunito Sans', sans-serif" }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10, padding: '1rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', textAlign: 'center' }}>{empresa.nome}</h1>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
            {empresa.cidade && <span>📍 {empresa.cidade}</span>}
            {empresa.instagram && <span>📸 @{empresa.instagram}</span>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        {prods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <p style={{ fontSize: '1.1rem', color: '#64748b' }}>Nenhum produto disponível no catálogo no momento.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {prods.map(p => {
              const preco = getPreco(p)
              const waText = encodeURIComponent(`Olá! Tenho interesse no produto: *${p.nome}*`)
              
              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  {/* Imagem (placeholder se não tiver) */}
                  <div style={{ width: '100%', aspectRatio: '1/1', background: '#f1f5f9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.imagem_url ? (
                      <img src={p.imagem_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '3rem', opacity: 0.2 }}>📦</span>
                    )}
                    {p.destaque && (
                      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#fbbf24', color: '#78350f', padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ★ Destaque
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem', lineHeight: 1.3 }}>{p.nome}</h3>
                    {p.descricao && <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.descricao}</p>}
                    
                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                      {preco !== null ? (
                        <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco)}
                        </p>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>Preço sob consulta</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer CTA */}
                  {hasWhatsapp && (
                    <div style={{ padding: '0 1rem 1rem' }}>
                      <a href={`https://wa.me/55${whatsappNumber}?text=${waText}`} target="_blank" rel="noopener noreferrer" 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.625rem', background: '#25D366', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', transition: 'filter 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.9)'}
                        onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
                        <MessageCircle size={16} />
                        Pedir pelo WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer System */}
      <footer style={{ padding: '2rem 1rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', background: '#fff', marginTop: '2rem' }}>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Catálogo online gerado pelo <a href="https://kdl-store.vercel.app" target="_blank" style={{ color: '#059669', textDecoration: 'none', fontWeight: 700 }}>KDL Store</a>
        </p>
      </footer>
    </div>
  )
}
