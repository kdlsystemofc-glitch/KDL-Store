import { createClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 60

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
  const { data: empresa } = await supabaseAdmin
    .from('empresas')
    .select('nome')
    .eq('slug', resolvedParams.slug)
    .single()
  return {
    title: empresa ? `Catálogo — ${empresa.nome}` : 'Loja não encontrada',
    description: empresa ? `Confira o catálogo de produtos de ${empresa.nome}` : '',
  }
}

export default async function LojaPublicaPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const { slug } = resolvedParams

  if (!slug) return notFound()

  const supabaseAdmin = getAdminClient()
  if (!supabaseAdmin) return notFound()

  const { data: empresa } = await supabaseAdmin
    .from('empresas')
    .select('id, nome, telefone, whatsapp, instagram, cidade')
    .eq('slug', slug)
    .single()

  if (!empresa) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>Loja não encontrada</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Verifique se o link está correto.</p>
        </div>
      </div>
    )
  }

  const { data: produtos } = await supabaseAdmin
    .from('produtos')
    .select('id, nome, descricao, preco_catalogo, preco_varejo, preco_atacado, preco_vip, destaque, imagem_url')
    .eq('empresa_id', empresa.id)
    .eq('ativo', true)
    .eq('ativo_catalogo', true)
    .order('destaque', { ascending: false, nullsFirst: false })
    .order('nome')

  const prods = produtos || []
  const whatsappNumber = (empresa.whatsapp || empresa.telefone || '').replace(/\D/g, '')
  const hasWhatsapp = !!whatsappNumber

  function getPreco(p: Record<string, unknown>) {
    const tipo = (p.preco_catalogo as string) || 'varejo'
    if (tipo === 'ocultar') return null
    if (tipo === 'atacado') return (p.preco_atacado as number) || (p.preco_varejo as number)
    if (tipo === 'vip')     return (p.preco_vip as number) || (p.preco_varejo as number)
    return p.preco_varejo as number
  }

  function formatBRL(val: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f172a; font-family: 'Nunito Sans', sans-serif; }
        .catalog-card { background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); box-shadow: 0 4px 24px rgba(0,0,0,0.3); display: flex; flex-direction: column; transition: transform 0.18s, box-shadow 0.18s; }
        .catalog-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
        .wa-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 0.65rem; background: #25D366; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 0.85rem; transition: filter 0.18s, transform 0.12s; }
        .wa-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
        .badge-destaque { position: absolute; top: 0.6rem; right: 0.6rem; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #78350f; padding: 0.2rem 0.7rem; border-radius: 99px; font-size: 0.68rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; }
        @media (max-width: 480px) { .grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'Nunito Sans', sans-serif" }}>

        {/* Header */}
        <header style={{
          background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'sticky', top: 0, zIndex: 10, padding: '1rem 1.5rem',
        }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f1f5f9', textAlign: 'center' }}>
              {empresa.nome}
            </h1>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap', justifyContent: 'center' }}>
              {empresa.cidade && <span>📍 {empresa.cidade}</span>}
              {empresa.instagram && <span>📸 @{empresa.instagram}</span>}
              {whatsappNumber && <span>📱 {empresa.whatsapp || empresa.telefone}</span>}
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.25rem' }}>
          {prods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</p>
              <p style={{ fontSize: '1.1rem', color: '#64748b' }}>Nenhum produto disponível no catálogo no momento.</p>
            </div>
          ) : (
            <>
              <p style={{ color: '#475569', fontSize: '0.82rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                {prods.length} produto{prods.length !== 1 ? 's' : ''} disponível{prods.length !== 1 ? 'eis' : ''}
              </p>
              <div className="grid">
                {prods.map((p) => {
                  const preco = getPreco(p as Record<string, unknown>)
                  const waText = encodeURIComponent(`Olá! Tenho interesse no produto: *${p.nome}*`)

                  return (
                    <div key={p.id} className="catalog-card">
                      {/* Imagem */}
                      <div style={{ width: '100%', aspectRatio: '1/1', background: '#0f172a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {p.imagem_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imagem_url as string}
                            alt={p.nome as string}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: '3.5rem', opacity: 0.15 }}>📦</span>
                        )}
                        {p.destaque && <div className="badge-destaque">★ Destaque</div>}
                      </div>

                      {/* Info */}
                      <div style={{ padding: '0.875rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.3 }}>
                          {p.nome as string}
                        </h3>
                        {p.descricao && (
                          <p style={{
                            fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {p.descricao as string}
                          </p>
                        )}
                        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                          {preco !== null ? (
                            <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#00bfa5' }}>
                              {formatBRL(preco)}
                            </p>
                          ) : (
                            <p style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                              Preço sob consulta
                            </p>
                          )}
                        </div>
                      </div>

                      {/* CTA WhatsApp */}
                      {hasWhatsapp && (
                        <div style={{ padding: '0 0.875rem 0.875rem' }}>
                          <a
                            href={`https://wa.me/55${whatsappNumber}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wa-btn"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Pedir pelo WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer style={{ padding: '2rem 1.25rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '2rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#334155' }}>
            Catálogo gerado pelo{' '}
            <a href="https://kdl-store.vercel.app" target="_blank" rel="noopener noreferrer"
              style={{ color: '#00bfa5', textDecoration: 'none', fontWeight: 700 }}>
              KDL Store
            </a>
          </p>
        </footer>
      </div>
    </>
  )
}
