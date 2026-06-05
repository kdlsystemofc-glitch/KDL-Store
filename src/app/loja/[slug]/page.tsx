import { createClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CatalogoCliente from './CatalogoCliente'

export const revalidate = 60

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabaseAdmin = getAdminClient()
  if (!supabaseAdmin) return { title: 'Loja não encontrada' }
  const { data } = await supabaseAdmin.from('empresas').select('nome, catalogo_descricao').eq('slug', slug).single()
  return {
    title: data ? `${data.nome} — Catálogo Online` : 'Loja não encontrada',
    description: data?.catalogo_descricao || (data ? `Confira os produtos de ${data.nome}` : ''),
  }
}

export default async function LojaPublicaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slug) return notFound()

  const supabaseAdmin = getAdminClient()
  if (!supabaseAdmin) return notFound()

  const { data: empresa } = await supabaseAdmin
    .from('empresas')
    .select('id, nome, telefone, whatsapp, instagram, cidade, estado, logo_url, catalogo_cor_primaria, catalogo_cor_secundaria, catalogo_descricao, catalogo_template, catalogo_fonte, catalogo_logo_url, catalogo_mostrar_carrinho, catalogo_formas_envio')
    .eq('slug', slug)
    .single()

  if (!empresa) return notFound()

  const { data: produtos } = await supabaseAdmin
    .from('produtos')
    .select('id, nome, descricao, preco_catalogo, preco_varejo, preco_atacado, preco_vip, destaque, imagem_url, categoria')
    .eq('empresa_id', empresa.id)
    .eq('ativo', true)
    .eq('ativo_catalogo', true)
    .order('destaque', { ascending: false, nullsFirst: false })
    .order('nome')

  return (
    <CatalogoCliente
      empresa={{
        nome: empresa.nome,
        telefone: empresa.telefone,
        whatsapp: empresa.whatsapp,
        instagram: empresa.instagram,
        cidade: empresa.cidade,
        estado: empresa.estado,
        catalogo_cor_primaria: empresa.catalogo_cor_primaria || '#6C63FF',
        catalogo_cor_secundaria: empresa.catalogo_cor_secundaria || '#00BFA5',
        catalogo_descricao: empresa.catalogo_descricao,
        catalogo_template: empresa.catalogo_template || 'moderno',
        catalogo_fonte: empresa.catalogo_fonte || 'Inter',
        catalogo_logo_url: empresa.catalogo_logo_url || empresa.logo_url || null,
        catalogo_mostrar_carrinho: empresa.catalogo_mostrar_carrinho !== false,
        catalogo_formas_envio: empresa.catalogo_formas_envio || null,
      }}
      produtos={produtos || []}
    />
  )
}
